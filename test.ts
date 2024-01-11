import { Project } from "./lib";
import { Video } from "./lib/Elements/Video";
import { Text } from "./lib/Elements/Text";
import { waitForAllInstancesToClose } from "./lib/ffmpeg";

// set environment variable to use canvas
process.env["FFMPEG_PATH"] = "C:/Users/theen/Desktop/NodeVideoEditor/ffmpegBin/ffmpeg.exe";
process.env["FFPROBE_PATH"] = "C:/Users/theen/Desktop/NodeVideoEditor/ffmpegBin/ffprobe.exe";

(async () => {

    const testProject = new Project(1920, 1080, 24)

    const busVideo = new Video('./bus.mov', testProject)
    testProject.timeline.addElement(busVideo, 0)

    const catVideo = new Video('./cat.mp4', testProject)
    catVideo.Transform.x = 1920 / 2
    catVideo.zIndex = 1
    testProject.timeline.addElement(catVideo, 20)

    await waitForAllInstancesToClose() // wait for the ffprobe calls to finish

    const text = new Text(testProject)
    text.text = "Hello World!"
    text.fontSize = 50
    text.color = "white"

    text.zIndex = 2
    text.Duration = 100
    testProject.timeline.addElement(text, 0)

    await testProject.render()

})()