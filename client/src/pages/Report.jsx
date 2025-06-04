import React, { useState, useRef , useEffect} from 'react';
import { useReactToPrint } from 'react-to-print';
import { getPriority } from '../utils';

const categoryQuestionMap = {
  Infrastructure: 'Give complaints of infrastructure .',
  Faculty: 'give complaint or issue regarding faculty.',
  Examinations: 'Share your issue related to examinations.',
  Hostel: 'give all complaints of hostel.',
  Library: 'Mention any complaint regarding the library.',
  Ragging: 'Report any incident or concern related to ragging.',
};

const categories = Object.keys(categoryQuestionMap);
const ReportGenerator = () => {
  const [category, setCategory] = useState('');
  const [input, setInput] = useState('');
  const [responseData, setResponseData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const componentRef = useRef(null);

  const API_URL = 'http://127.0.0.1:5000/admin/report';

  const handlePrint = useReactToPrint({
    contentRef:componentRef
  });

  const handleGenerateReport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_report' }),
      });
      const data = await response.json();
      setResponseData(data);
    } catch (error) {
      setResponseData([{ error: error.message }]);
    } finally {
      setIsLoading(false);
    }
  };
   useEffect(() => {
      handleSubmitInput()
    }, [category]);
    const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;
    setInput(categoryQuestionMap[selectedCategory]);
    setCategory(selectedCategory);
    
    
  };

  const handleSubmitInput = async () => {
    if (!input.trim()) {
      setResponseData([{ error: 'Please enter some input' }]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input }),
      });
      const data = await response.json();
      setResponseData(data.data);
    } catch (error) {
      setResponseData([{ error: error.message }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <h1>Report Generator</h1>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={handleGenerateReport} disabled={isLoading} style={styles.buttonGreen}>
          {isLoading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>Select Category: </label>
        <select
          value={category}
          onChange={handleCategoryChange}
          style={{ padding: '10px', marginBottom: '10px', width: '100%' }}
        >
          <option value="">-- Select Category --</option>
          {categories.map((cat) => (
            <option key={cat}  value={cat}>{cat}</option>
          ))}
        </select>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter your question or input here..."
          style={styles.textarea}
        />
        <button onClick={handleSubmitInput} disabled={isLoading} style={styles.buttonBlue}>
          {isLoading ? 'Submitting...' : 'Submit Input'}
        </button>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <button onClick={handlePrint} style={styles.buttonGray}>Print Report</button>
      </div>

      {/* Always render table so ref is never null */}
      <div ref={componentRef} style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr>
            <th style={styles.th}>Title</th>
            <th style={styles.th}>Category</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Priority</th>
            <th style={styles.th}>Complaint</th>
            <th style={styles.th}>Proof</th>
            <th style={styles.th}>Last Update</th>
            </tr>
          </thead>
          <tbody>
            {responseData.length > 0 ? responseData.map((item, idx) => (
              <tr key={idx}>
                <td style={styles.td}>{item.title}</td>
                <td style={styles.td}>{item.issue_category?.join(', ')}</td>
                <td style={styles.td}>{item.status}</td>
                <td style={styles.td}>{getPriority(item.priority_factor)}</td>
                <td style={styles.td}>{item.complaint}</td>
                <td style={styles.td}>
                  <a href={item.complaint_proof} target="_blank" rel="noopener noreferrer">Click Here for Proof</a>
                </td>
                <td style={styles.td}>
                  {item.lastupdate ? new Date(item.lastupdate).toLocaleString() : ''}
                </td>
              </tr>
            )) : (
              <tr>
                <td style={styles.td} colSpan="8" align="center">No data yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  buttonGreen: {
    padding: '10px 15px',
    marginRight: '10px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  buttonBlue: {
    padding: '10px 15px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  buttonGray: {
    padding: '8px 12px',
    backgroundColor: '#666',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    minHeight: '100px',
    marginBottom: '10px',
    borderRadius: '4px',
    border: '1px solid #ddd',
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0',
    marginTop: '20px',
  },
  th: {
    padding: '12px',
    backgroundColor: '#f2f2f2',
    border: '1px solid #ccc',
    fontWeight: 'bold',
    textAlign: 'left',
  },
  td: {
    padding: '12px',
    border: '1px solid #ddd',
    verticalAlign: 'top',
  },
};

export default ReportGenerator;
