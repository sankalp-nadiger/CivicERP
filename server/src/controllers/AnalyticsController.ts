import { Request, Response } from 'express';
import axios from 'axios';
import { Complaint, Department, User } from '../models/index.js';
import {
  haversineDistanceKm,
  tryParseLatLngFromText,
  type LatLng,
} from '../utils/geo.js';

type WeatherSnapshot = {
  temperatureC: number | null;
  humidityPct: number | null;
  rainfallMm: number | null;
};

type Insight = {
  location: string;
  issue: string;
  confidence: 'High' | 'Medium' | 'Low';
  recommendation: string;
};

type Cluster = {
  center: LatLng;
  count: number;
  departmentCounts: Record<string, number>;
  locationNames?: string[];
};

type TextCluster = {
  locationLabel: string;
  count: number;
  departmentCounts: Record<string, number>;
};

const normalize = (value: unknown): string =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const inferDepartmentName = (raw: {
  issue_category?: unknown;
  departmentId?: any;
}): string => {
  const depName = raw.departmentId?.name ? String(raw.departmentId.name) : '';
  if (depName.trim()) return depName.trim();

  const cats = Array.isArray(raw.issue_category) ? raw.issue_category : [];
  const joined = normalize(cats.join(' '));

  if (/(road|pothole|street|asphalt|drainage\s*cover)/.test(joined)) return 'Roads';
  if (/(sanitation|garbage|waste|trash|clean|sweep|sewage)/.test(joined)) return 'Sanitation';
  if (/(water|pipeline|leak|tap|pressure|supply)/.test(joined)) return 'Water';

  const first = cats[0] ? String(cats[0]).trim() : '';
  return first || 'General';
};

const extractLatLng = (raw: { location?: unknown }): LatLng | null => tryParseLatLngFromText(raw.location);

const roundCoordKey = (lat: number, lng: number) => `${lat.toFixed(3)},${lng.toFixed(3)}`;

const fetchWeather = async (lat: number, lng: number): Promise<WeatherSnapshot> => {
  const apiKey = String(process.env.OPENWEATHER_API_KEY || '').trim();
  if (!apiKey) {
    return { temperatureC: null, humidityPct: null, rainfallMm: null };
  }

  try {
    const url = 'https://api.openweathermap.org/data/2.5/weather';
    const { data } = await axios.get(url, {
      params: {
        lat,
        lon: lng,
        appid: apiKey,
        units: 'metric',
      },
      timeout: 8000,
    });

    const temperatureC = typeof data?.main?.temp === 'number' ? data.main.temp : null;
    const humidityPct = typeof data?.main?.humidity === 'number' ? data.main.humidity : null;
    const rain1h = data?.rain && typeof data.rain['1h'] === 'number' ? data.rain['1h'] : null;
    const rain3h = data?.rain && typeof data.rain['3h'] === 'number' ? data.rain['3h'] : null;
    const rainfallMm = rain1h ?? rain3h ?? 0;

    return { temperatureC, humidityPct, rainfallMm };
  } catch (e: any) {
    // Weather is optional; don't fail prediction if weather API fails
    console.warn(`⚠️ Weather lookup failed for (${lat}, ${lng}):`, e?.message || e);
    return { temperatureC: null, humidityPct: null, rainfallMm: null };
  }
};

const buildClusters = (points: Array<{ latLng: LatLng; department: string; location?: unknown }>, distanceKm = 1): Cluster[] => {
  const clusters: Array<{ center: LatLng; points: Array<{ latLng: LatLng; department: string; location?: unknown }> }> = [];

  for (const p of points) {
    let target = clusters.find(c => haversineDistanceKm(c.center, p.latLng) < distanceKm);

    if (!target) {
      clusters.push({ center: { ...p.latLng }, points: [p] });
      continue;
    }

    target.points.push(p);
    const n = target.points.length;
    const avgLat = target.points.reduce((sum, x) => sum + x.latLng.lat, 0) / n;
    const avgLng = target.points.reduce((sum, x) => sum + x.latLng.lng, 0) / n;
    target.center = { lat: avgLat, lng: avgLng };
  }

  return clusters.map(c => {
    const departmentCounts: Record<string, number> = {};
    const locationNames: string[] = [];

    for (const p of c.points) {
      departmentCounts[p.department] = (departmentCounts[p.department] || 0) + 1;
      if (p.location) {
        locationNames.push(String(p.location).trim());
      }
    }

    return {
      center: c.center,
      count: c.points.length,
      departmentCounts,
      locationNames: [...new Set(locationNames)], // deduplicate
    };
  });
};

const buildTextClusters = (rows: Array<{ location?: unknown; department: string }>): TextCluster[] => {
  const map = new Map<string, TextCluster>();

  for (const r of rows) {
    const rawLocation = String(r.location ?? '').trim();
    if (!rawLocation) continue;

    const key = normalize(rawLocation);
    if (!key) continue;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        locationLabel: rawLocation,
        count: 1,
        departmentCounts: { [r.department]: 1 },
      });
      continue;
    }

    existing.count += 1;
    existing.departmentCounts[r.department] = (existing.departmentCounts[r.department] || 0) + 1;
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
};

const confidenceFrom = (score: number): 'High' | 'Medium' | 'Low' => {
  if (score >= 0.75) return 'High';
  if (score >= 0.45) return 'Medium';
  return 'Low';
};

const buildInsightsForCluster = (cluster: Cluster, weather: WeatherSnapshot): Insight[] => {
  const deptNormCounts: Record<string, number> = {};
  for (const [k, v] of Object.entries(cluster.departmentCounts)) {
    const nk = normalize(k);
    deptNormCounts[nk] = (deptNormCounts[nk] || 0) + v;
  }

  const roadsCount = Object.entries(deptNormCounts)
    .filter(([k]) => /road|pothole|street/.test(k))
    .reduce((sum, [, v]) => sum + v, 0);
  const sanitationCount = Object.entries(deptNormCounts)
    .filter(([k]) => /sanitation|garbage|waste|trash|sewage/.test(k))
    .reduce((sum, [, v]) => sum + v, 0);
  const waterCount = Object.entries(deptNormCounts)
    .filter(([k]) => /water|pipeline|leak|pressure|supply/.test(k))
    .reduce((sum, [, v]) => sum + v, 0);

  const rainfall = weather.rainfallMm ?? 0;

  // Get most common location name, or first one if none
  let locationLabel: string;
  if (cluster.locationNames && cluster.locationNames.length > 0) {
    const locationCounts = new Map<string, number>();
    for (const loc of cluster.locationNames) {
      locationCounts.set(loc, (locationCounts.get(loc) || 0) + 1);
    }
    const mostCommon = Array.from(locationCounts.entries())
      .sort((a, b) => b[1] - a[1])[0];
    locationLabel = mostCommon ? mostCommon[0] : cluster.locationNames[0];
  } else {
    locationLabel = `Cluster center (${cluster.center.lat.toFixed(5)}, ${cluster.center.lng.toFixed(5)})`;
  }

  const insights: Insight[] = [];
  const loc = locationLabel;

  // Rule: pothole risk when rainy and road complaints spike
  if (roadsCount >= 3) {
    const rainFactor = Math.min(1, rainfall / 5);
    const volumeFactor = Math.min(1, roadsCount / 8);
    const score = 0.35 + 0.35 * rainFactor + 0.3 * volumeFactor;

    if (rainfall >= 1) {
      insights.push({
        location: loc,
        issue: 'Pothole Risk',
        confidence: confidenceFrom(score),
        recommendation: 'Deploy road inspection/repair team; prioritize drainage-heavy stretches.',
      });
    }
  }

  // Rule: sanitation hotspot
  if (sanitationCount >= 3) {
    const volumeFactor = Math.min(1, sanitationCount / 8);
    const humidityFactor = weather.humidityPct == null ? 0.2 : Math.min(1, weather.humidityPct / 100);
    const score = 0.4 + 0.4 * volumeFactor + 0.2 * humidityFactor;

    insights.push({
      location: loc,
      issue: 'Garbage Accumulation Hotspot',
      confidence: confidenceFrom(score),
      recommendation: 'Increase waste pickup frequency; place temporary bins and schedule street sweeping.',
    });
  }

  // Rule: water leakage risk
  if (waterCount >= 3) {
    const volumeFactor = Math.min(1, waterCount / 8);
    const score = 0.45 + 0.55 * volumeFactor;

    insights.push({
      location: loc,
      issue: 'Possible Pipeline Leakage Issue',
      confidence: confidenceFrom(score),
      recommendation: 'Dispatch water team for leak detection; inspect valves and junction points.',
    });
  }

  return insights;
};

const buildFallbackInsightsFromTextClusters = (clusters: TextCluster[]): Insight[] => {
  const insights: Insight[] = [];

  for (const cluster of clusters) {
    if (cluster.count < 2) continue;

    const deptNormCounts: Record<string, number> = {};
    for (const [k, v] of Object.entries(cluster.departmentCounts)) {
      const nk = normalize(k);
      deptNormCounts[nk] = (deptNormCounts[nk] || 0) + v;
    }

    const roadsCount = Object.entries(deptNormCounts)
      .filter(([k]) => /road|pothole|street/.test(k))
      .reduce((sum, [, v]) => sum + v, 0);
    const sanitationCount = Object.entries(deptNormCounts)
      .filter(([k]) => /sanitation|garbage|waste|trash|sewage/.test(k))
      .reduce((sum, [, v]) => sum + v, 0);
    const waterCount = Object.entries(deptNormCounts)
      .filter(([k]) => /water|pipeline|leak|pressure|supply/.test(k))
      .reduce((sum, [, v]) => sum + v, 0);

    const loc = `Area: ${cluster.locationLabel}`;
    const score = Math.min(0.9, 0.25 + cluster.count / 10);

    if (roadsCount >= 2) {
      insights.push({
        location: loc,
        issue: 'Road Maintenance Risk',
        confidence: confidenceFrom(score),
        recommendation: 'Schedule rapid road inspection and patching in this area.',
      });
      continue;
    }

    if (sanitationCount >= 2) {
      insights.push({
        location: loc,
        issue: 'Garbage Accumulation Hotspot',
        confidence: confidenceFrom(score),
        recommendation: 'Increase waste collection rounds and deploy spot-cleaning team.',
      });
      continue;
    }

    if (waterCount >= 2) {
      insights.push({
        location: loc,
        issue: 'Water Service Attention Needed',
        confidence: confidenceFrom(score),
        recommendation: 'Inspect supply lines and pressure in this locality.',
      });
      continue;
    }

    insights.push({
      location: loc,
      issue: 'Service Demand Spike',
      confidence: confidenceFrom(score),
      recommendation: 'Review repeated complaints here and assign targeted field follow-up.',
    });
  }

  return insights;
};

class AnalyticsController {
  private async getRequester(req: Request) {
    const requesterId = (req as any)?.user?.id as string | undefined;
    if (!requesterId) return null;
    return User.findById(requesterId).select('email governanceLevel governanceType role departmentId').lean();
  }

  private async getDepartmentForLevel2Email(email: string, governanceType?: string) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) return null;

    const query: any = {};
    if (governanceType) query.governanceType = String(governanceType).toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select('_id email').lean();
    const or: any[] = [{ email: normalizedEmail }];
    if (user?._id) or.push({ userId: user._id });

    const preferred = await Department.findOne({ ...query, level: 2, $or: or })
      .select('_id name email userId level')
      .lean();
    if (preferred) return preferred as any;

    return Department.findOne({ ...query, $or: or }).select('_id name email userId level').lean();
  }

  async predict(req: Request, res: Response) {
    try {
      const requester = await this.getRequester(req);
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const weatherEnabled = String(process.env.OPENWEATHER_API_KEY || '').trim().length > 0;

      const query: any = { date: { $gte: since } };

      // If Level 2 (department head), filter by their department
      const level = String((requester as any)?.governanceLevel || '').toUpperCase();
      if (level === 'LEVEL_2') {
        const dept = await this.getDepartmentForLevel2Email(
          String((requester as any)?.email || ''),
          String((requester as any)?.governanceType || '')
        );
        if (dept?._id) {
          query.departmentId = (dept as any)._id;
        }
      }

      const recent = await Complaint.find(query)
        .select('location issue_category departmentId date')
        .populate('departmentId', 'name')
        .lean();

      console.log(`📊 [Predict] Found ${recent.length} recent complaints, extracting coordinates...`);

      // Fetch department names if complaint.departmentId isn't populated due to legacy data
      // (no-op when populate is enough).
      const departmentIdSet = new Set<string>();
      for (const c of recent as any[]) {
        if (c?.departmentId && typeof c.departmentId === 'string') departmentIdSet.add(c.departmentId);
      }
      if (departmentIdSet.size > 0) {
        const deps = await Department.find({ _id: { $in: Array.from(departmentIdSet) } })
          .select('_id name')
          .lean();
        const map = new Map(deps.map(d => [String((d as any)._id), (d as any).name]));
        for (const c of recent as any[]) {
          if (typeof c.departmentId === 'string' && map.has(c.departmentId)) {
            c.departmentId = { name: map.get(c.departmentId) };
          }
        }
      }

      const points: Array<{ latLng: LatLng; department: string; location?: unknown }> = [];
      for (const c of recent as any[]) {
        const latLng = extractLatLng(c);
        if (!latLng) {
          console.log(`📍 [Predict] Could not parse coordinates from location: "${c.location}"`);
          continue;
        }
        const department = inferDepartmentName(c);
        points.push({ latLng, department, location: c.location });
      }

      console.log(`📍 [Predict] Extracted ${points.length} points with valid coordinates from ${recent.length} complaints`);

      if (points.length === 0) {
        console.log(`📍 [Predict] No geo points found, falling back to text clustering...`);
        const textClusters = buildTextClusters(
          (recent as any[]).map(c => ({ location: c.location, department: inferDepartmentName(c) }))
        );
        const insights = buildFallbackInsightsFromTextClusters(textClusters);
        return res.status(200).json({
          insights,
          meta: {
            mode: 'text-fallback',
            recentComplaints: recent.length,
            geoPoints: 0,
            textClusters: textClusters.length,
            weatherEnabled,
          },
        });
      }

      const clusters = buildClusters(points, 1);
      console.log(`🗂️ [Predict] Built ${clusters.length} geographic clusters`);

      // Weather lookup with simple cache to reduce API hits
      const weatherCache = new Map<string, WeatherSnapshot>();
      const clusterWeathers = await Promise.all(
        clusters.map(async c => {
          const key = roundCoordKey(c.center.lat, c.center.lng);
          if (weatherCache.has(key)) return weatherCache.get(key)!;
          const w = await fetchWeather(c.center.lat, c.center.lng);
          weatherCache.set(key, w);
          return w;
        })
      );

      const insights = clusters
        .flatMap((c, i) => buildInsightsForCluster(c, clusterWeathers[i]))
        .sort((a, b) => {
          const rank = (x: Insight) => (x.confidence === 'High' ? 3 : x.confidence === 'Medium' ? 2 : 1);
          return rank(b) - rank(a);
        });

      console.log(`💡 [Predict] Generated ${insights.length} insights from ${clusters.length} clusters`);

      return res.status(200).json({
        insights,
        meta: {
          mode: 'geo-weather',
          recentComplaints: recent.length,
          geoPoints: points.length,
          clusters: clusters.length,
          weatherEnabled,
        },
      });
    } catch (e: any) {
      const message = e?.message || 'Failed to generate predictions';
      console.error(`❌ [Predict] Error: ${message}`, e);
      return res.status(400).json({ message });
    }
  }
}

export default new AnalyticsController();
