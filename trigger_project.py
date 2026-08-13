import urllib.request
import urllib.parse
import json
import time

def trigger_project():
    url = "http://localhost:8000/projects/analyze"
    data = json.dumps({"idea": "A simple web app for tracking daily habits"}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json", "Authorization": "Bearer bypass"})
    try:
        res = urllib.request.urlopen(req)
        print("Response:", res.read().decode())
    except urllib.error.HTTPError as e:
        print("Error:", e.code, e.read().decode())

trigger_project()
