import { createCanvas, Canvas, SKRSContext2D, ImageData as SKIAImageData } from '@napi-rs/canvas'
import { Element, Project } from '..'
import { ffmpeg, ffprobeGetDuration, ffprobeGetResolution } from '../ffmpeg';

export class Video extends Element {

    private frames: Buffer[] = [];
    private parent: Project

    public src: string

    constructor(src: string, parentProject: Project) {
        super()
        this.parent = parentProject
        this.src = src

        ffprobeGetDuration(this.src).then((duration) => {
            this.Duration = Math.floor(duration * this.parent.frameRate)
        })
        ffprobeGetResolution(this.src).then((resolution) => {
            this.Transform._elementWidth = resolution.width
            this.Transform._elementHeight = resolution.height

            this.Transform.width = resolution.width
            this.Transform.height = resolution.height
        })
    }

    buildFrames(): Promise<void> {
        const file = this.src
        // get a buffer png for each frame based on the parent project's frame rate
        return new Promise((resolve, reject) => {

            // use the ffmpeg wrapper
            let ffmpegExec = ffmpeg([
                '-i',
                file,
                '-f',
                'image2pipe',
                '-vcodec',
                'rawvideo',
                '-pix_fmt',
                'rgba',
                '-r',
                this.parent.frameRate.toString(),
                '-'
            ])

            var currentBuffer = Buffer.alloc(0)
            let i = 0
            ffmpegExec.stdout.on('data', (chunk: Buffer) => {
                // check if the buffer starts with the PNG header then add it to the current buffer
                currentBuffer = Buffer.concat([currentBuffer, chunk])
                if (currentBuffer.length >= this.Transform.width * this.Transform.height * 4) {
                    this.frames.push(currentBuffer.slice(0, this.Transform.width * this.Transform.height * 4))
                    currentBuffer = currentBuffer.slice(this.Transform.width * this.Transform.height * 4)
                }
            })
            ffmpegExec.stderr.on('data', (chunk) => {
                //console.log(chunk.toString())
            })
            ffmpegExec.on('close', () => {
                setTimeout(() => {
                    this.frames.push(currentBuffer)
                    resolve()
                }, 50)
            })
        })

    }

    getFrameAtTime(time: number): Promise<SKIAImageData> {

        return new Promise<SKIAImageData>((resolve, reject) => {

            let frameIndex = Math.min(time - this._start, this.frames.length - 1)
            console.log("[FRAME] Getting frame at time " + frameIndex)
            let frame = this.frames[frameIndex]

            const u8array = new Uint8ClampedArray(frame)
            const data = new SKIAImageData(u8array, this.Transform.width, this.Transform.height)
            this.frames[frameIndex] = Buffer.alloc(0)

            resolve(data)
        })
    }
}