FROM python:3.10-alpine

WORKDIR /ml

COPY . .


RUN pip install -r requirements.txt

EXPOSE 5000

CMD [ "python","main.py" ]