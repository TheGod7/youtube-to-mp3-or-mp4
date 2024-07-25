# Youtube video converter api

A simple api to convert youtube videos in mp3 files or mp4 files

### Installing

to install you only need to copy the repository and put this commands

```bash
npm install
node app.js
```

## Usage <a name = "usage"></a>

the usage of the apis is simple only have 2 routes

the 1 route is `/api/:url/youtube/info?audioOnly=false` <br>
the url parameter is the id of the youtube video and the query parameter is if you only want the mp3 format or the mp4 format the default value is false

the 2 route is `/api/:url/youtube/download?audioOnly=false`
the url parameter is the id of the youtube video and the query parameter is if you want only the audio this route needs a body

```json
{
  "quality": "720p", // the quality of the video you can use the 1 route to list all quality's like 720p
  "bitrate": 160 // is the audio bitrate that you want to download only when you want to download the audio
}
```
