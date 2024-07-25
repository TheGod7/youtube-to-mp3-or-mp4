import express from "express";
import fs from "fs";
import ytdl from "@distube/ytdl-core";
import chalk from "chalk";
import ffmpeg from "fluent-ffmpeg";

import constants from "./constants.js";
import path from "path";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/:url/youtube/info", async (req, res) => {
  const url = req.params.url;
  const audio = req.query.audioOnly || false;

  try {
    const videoInfo = await ytdl.getInfo(url);

    console.log(
      chalk.yellow(
        `[Server] Searching the format of ${videoInfo.videoDetails.title}`
      )
    );
    if (audio) {
      const audioFormats = videoInfo.formats.filter(
        (video) => video.hasVideo == false && video.hasAudio == true
      );

      const videoMap = audioFormats.map(
        (video) => `mp3 - ${video.audioBitrate}`
      );

      res.json(videoMap);
    } else {
      const videoFormats = videoInfo.formats.filter(
        (video) => video.hasVideo == true && video.container == "mp4"
      );

      const videoMap = videoFormats.map(
        (video) => `${type} - ${video.qualityLabel}`
      );

      res.json(videoMap);
    }
  } catch (e) {
    res.json(e.message);
  }
});

app.get("/api/:url/youtube/download", async (req, res) => {
  const url = req.params.url;
  const audio = req.query.audioOnly || false;
  const { bitrate, quality } = req.body;

  // const bitrate = 160;
  // const quality = "720p";
  const clientStart = Date.now();

  try {
    const videoInfo = await ytdl.getInfo(url);
    const startTime = Date.now();

    console.log(
      chalk.yellow(
        `[Client]  Downloading the youtube video ${videoInfo.videoDetails.title}`
      )
    );
    if (audio) {
      const audioFilter = (format) =>
        format.audioBitrate == bitrate &&
        format.hasAudio == true &&
        format.hasVideo == false;

      const audioFormat = videoInfo.formats.filter(audioFilter);

      if (audioFormat.length <= 0) throw new Error("Audio format not found");

      const audioPath = path.join(
        process.cwd(),
        "download",
        "audio",
        `${videoInfo.videoDetails.title.replace(/\//g, "-")}`
      );

      const audioStream = fs.createWriteStream(
        `${audioPath}.${audioFormat[0].container}`
      );

      const stream = ytdl(url, {
        format: audioFormat[0],
      });

      stream.pipe(audioStream);

      stream.on("end", () => {
        let finishTime = Date.now();

        let diffInSeconds = (finishTime - startTime) / 1000;

        console.log(
          chalk.green(
            `[Client] Finishing the download of the ${videoInfo.videoDetails.title} in ${diffInSeconds}`
          )
        );

        console.log(chalk.yellow(`[Client] Converting in to mp3 file`));

        ffmpeg()
          .input(`${audioPath}.${audioFormat[0].container}`)
          .toFormat("mp3")
          .output(`${audioPath}.mp3`)
          .on("end", () => {
            finishTime = Date.now();
            diffInSeconds = (finishTime - startTime) / 1000;

            fs.unlinkSync(`${audioPath}.${audioFormat[0].container}`);

            console.log(
              chalk.green(
                `[Client] Finished the conversion of  ${videoInfo.videoDetails.title}  in ${diffInSeconds}`
              )
            );

            finishTime = Date.now();
            diffInSeconds = (finishTime - clientStart) / 1000;

            console.log(chalk.green(`[Client] Downloaded in ${diffInSeconds}`));

            res.download(`${audioPath}.mp3`, (err) => {
              if (err) {
                console.log(chalk.red(`[Client] Error in the download ` + err));
                fs.unlinkSync(`${audioPath}.mp3`);
              } else {
                console.log(chalk.green(`[Client] Finished the download `));
                console.log(chalk.red(`[Client] Deleting the files`));
                fs.unlinkSync(`${audioPath}.mp3`);
              }
            });
          })
          .on("error", (err) => {
            console.log(chalk.red(`[Client] Error in converting to mp3 file `));

            if (fs.existsSync(`${audioPath}.${audioFormat[0].container}`))
              fs.unlinkSync(`${audioPath}.${audioFormat[0].container}`);

            if (fs.existsSync(`${audioPath}.mp3`))
              fs.unlinkSync(`${audioPath}.mp3`);

            throw new Error(err.message);
          })
          .run();
      });
    } else {
      const videoFilter = (video) =>
        video.qualityLabel == quality && video.container == "mp4";

      const videoFormat = videoInfo.formats.filter(videoFilter);

      if (videoFormat.length <= 0) throw new Error("Video format not found");

      const videoPath = path.join(
        process.cwd(),
        "download",
        "video",
        `${videoInfo.videoDetails.title.replace(/\//g, "-")}`
      );

      const videoStream = fs.createWriteStream(videoPath + ".mp4");
      const stream = ytdl(url, { format: videoFormat[0] });

      stream.pipe(videoStream);

      stream.on("end", () => {
        let finishTime = Date.now();
        let diffInSeconds = (finishTime - startTime) / 1000;

        console.log(
          chalk.green(
            `[Client] Finished the download of  ${videoInfo.videoDetails.title}  in ${diffInSeconds}`
          )
        );

        if (videoFormat[0].hasAudio) {
          console.log(chalk.green(`[Client] Downloading the video`));
          res.download(videoPath + ".mp4");
        } else {
          console.log(
            chalk.yellow(
              `[Client] Downloading the audio of ${videoInfo.videoDetails.title}`
            )
          );
          const audioFilter = (video) =>
            video.audioQuality == "AUDIO_QUALITY_MEDIUM" &&
            video.hasAudio == true &&
            video.hasVideo == false;

          const audioFormat = videoInfo.formats.filter(audioFilter);

          if (audioFormat.length <= 0)
            throw new Error("Error in the audio format");

          const audioPath = path.join(
            process.cwd(),
            "download",
            "audio",
            `${videoInfo.videoDetails.title.replace(/\//g, "-")}`
          );

          const audioStream = fs.createWriteStream(
            `${audioPath}.${audioFormat[0].container}`
          );

          const audioStreamYTDL = ytdl(url, {
            format: audioFormat[0],
          });

          audioStreamYTDL.pipe(audioStream);

          audioStreamYTDL.on("end", () => {
            finishTime = Date.now();
            diffInSeconds = (finishTime - startTime) / 1000;

            console.log(
              chalk.green(
                `[Client] Finished the download of the audio  ${videoInfo.videoDetails.title}  in ${diffInSeconds}`
              )
            );

            console.log(chalk.yellow(`[Client] Converting the audio to a mp3`));
            ffmpeg()
              .input(`${audioPath}.${audioFormat[0].container}`)
              .toFormat("mp3")
              .output(`${audioPath}.mp3`)
              .on("end", () => {
                finishTime = Date.now();
                diffInSeconds = (finishTime - startTime) / 1000;

                fs.unlinkSync(`${audioPath}.${audioFormat[0].container}`);

                console.log(
                  chalk.green(
                    `[Client] Finished the conversion of  ${videoInfo.videoDetails.title}  in ${diffInSeconds}`
                  )
                );

                console.log(
                  chalk.yellow(`[Client] Combine the audio and video`)
                );

                ffmpeg()
                  .input(`${audioPath}.mp3`)
                  .input(`${videoPath}.mp4`)
                  .videoCodec("copy")
                  .audioCodec("aac")
                  .output(`${videoPath} - audio.mp4`)
                  .on("end", () => {
                    finishTime = Date.now();
                    diffInSeconds = (finishTime - startTime) / 1000;

                    fs.unlinkSync(`${audioPath}.mp3`);
                    fs.unlinkSync(`${videoPath}.mp4`);

                    console.log(
                      chalk.green(
                        `[Client] Finished the combination of  ${videoInfo.videoDetails.title}  in ${diffInSeconds}`
                      )
                    );

                    finishTime = Date.now();
                    diffInSeconds = (finishTime - clientStart) / 1000;

                    console.log(
                      chalk.green(
                        `[Client] Downloading the file in ${diffInSeconds}`
                      )
                    );

                    res.download(`${videoPath} - audio.mp4`, (err) => {
                      if (err) {
                        console.log(
                          chalk.red(`[Client] Error in the download ` + err)
                        );
                        fs.unlinkSync(`${videoPath} - audio.mp4`);
                      } else {
                        console.log(
                          chalk.green(`[Client] Finished the download `)
                        );
                        console.log(chalk.red(`[Client] Deleting the files`));
                        fs.unlinkSync(`${videoPath} - audio.mp4`);
                      }
                    });
                  })
                  .on("error", (err) => {
                    console.log(
                      chalk.red(`[Client] Error in combination  of the video`)
                    );

                    if (
                      fs.existsSync(`${audioPath}.${audioFormat[0].container}`)
                    )
                      fs.unlinkSync(`${audioPath}.${audioFormat[0].container}`);

                    if (fs.existsSync(`${audioPath}.mp3`))
                      fs.unlinkSync(`${audioPath}.mp3`);

                    if (fs.existsSync(`${videoPath}.mp4`))
                      fs.unlinkSync(`${videoPath}.mp4`);

                    if (fs.existsSync(`${videoPath} - audio.mp4`))
                      fs.unlinkSync(`${videoPath} - audio.mp4`);

                    throw new Error(err.message);
                  })
                  .run();
              })
              .on("error", (err) => {
                console.log(
                  chalk.red(`[Client] Error in converting to mp3 file `)
                );
                if (fs.existsSync(`${audioPath}.${audioFormat[0].container}`))
                  fs.unlinkSync(`${audioPath}.${audioFormat[0].container}`);

                if (fs.existsSync(`${audioPath}.mp3`))
                  fs.unlinkSync(`${audioPath}.mp3`);

                if (fs.existsSync(`${videoPath}.mp4`))
                  fs.unlinkSync(`${videoPath}.mp4`);
                throw new Error(err.message);
              })
              .run();
          });
        }
      });
    }
  } catch (e) {
    res.json(e.message);
  }
});

app.listen(constants.port, () => {
  console.log(chalk.green(`[Server] Server listening on ${constants.port}`));
});
