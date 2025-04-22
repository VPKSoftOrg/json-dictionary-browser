# JSON Dictionary 
A [PWA](https://en.wikipedia.org/wiki/Progressive_web_app) dictionary software using JSON as data format

Keeps a dictionary with user-specified entries for searching, editing and saving. Data can also be exported to or imported from JSON file. The data can be searched with text. The search uses [Fuse.js](https://www.fusejs.io).

The screenshots of the app using the [sample data](https://github.com/VPKSoftOrg/json-dictionary-browser/blob/develop/sample_data/chat_abbreviations.json) containing chat abbreviations dictionary:
![image](https://github.com/user-attachments/assets/d284e847-58e3-4315-8561-c5bfacb1ef1f) ![image](https://github.com/user-attachments/assets/3013cbd4-40b2-4ecd-ae68-6133c26b4861)

## The data format
A JSON data array with unique *id*, and *custom* fields

```json
[
    { "id": 10 , "name": "^5", "description": "High-five" },
    { "id": 11 , "name": "^URS", "description": "Up yours" },
]
```
