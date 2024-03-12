import { createCanvas, Canvas, SKRSContext2D, ImageData as SKIAImageData } from '@napi-rs/canvas'
import { Element, Project } from '..'
import { ffmpeg, ffprobeGetDuration, ffprobeGetResolution } from '../ffmpeg';
import { buffer } from 'stream/consumers';

export class Video extends Element {

    private frames: Buffer[] = [];
    private parent: Project

    public samples: number[] = []; // audio samples

    public src: string

    constructor(src: string, parentProject: Project) {
        super()
        this.parent = parentProject
        this.src = src
        this.hasAudio = true

        ffprobeGetDuration(this.src).then((duration) => {
            this.Duration = Math.floor(duration * this.parent.frameRate)
            console.log("Duration: " + this.Duration)
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

    public _sampleStart: number = 0 // the global sample number that indicates the first video sample
    public _sampleCount: number = 0 // the global sample number that indicates the last video sample

    buildSamples(): Promise<void> {
        const file = this.src
        this._sampleStart = (this._start / this.parent.frameRate) * 44100
        console.log(this._start)
        console.log("Sample start: " + this._sampleStart)
        return new Promise((resolve, reject) => {
            let ffmpegExec = ffmpeg([
                '-i',
                file,
                '-f',
                's16le',
                '-acodec',
                'pcm_s16le',
                '-ar',
                '44100',
                '-ac',
                '1',
                '-'
            ])

            ffmpegExec.stdout.on('data', (chunk: Buffer) => {
                for (let i = 0; i < chunk.length; i += 2) {
                    let value = chunk.readUInt16LE(i)
                    this.samples.push(value)
                }
            })
            ffmpegExec.stderr.on('data', (chunk) => {
                //console.log(chunk.toString())
            })
            ffmpegExec.on('close', () => {
                this._sampleCount = this.samples.length
                resolve()
            })
        })
    }

    _renderSamplesToWavFile() {
    
        const file: Buffer[] = [];

        // write the wav header
        file.push(Buffer.from('RIFF', 'ascii')) // RIFF
        file.push(Buffer.alloc(4)) // file size
        file.push(Buffer.from('WAVE', 'ascii')) // WAVE
        file.push(Buffer.from('fmt ', 'ascii')) // fmt
        file.push(Buffer.alloc(4)) // fmt size
        file.push(Buffer.alloc(2)) // format
        file.push(Buffer.alloc(2)) // channels
        file.push(Buffer.alloc(4)) // sample rate
        file.push(Buffer.alloc(4)) // byte rate
        file.push(Buffer.alloc(2)) // block align
        file.push(Buffer.alloc(2)) // bits per sample 
        file.push(Buffer.from('data', 'ascii')) // data
        file.push(Buffer.alloc(4)) // data size

        file[1].writeUInt32LE(44 + (this.samples.length * 2), 0) // file size

        file[4].writeUInt32LE(16, 0) // fmt size
        file[5].writeUInt16LE(1, 0) // format
        file[6].writeUInt16LE(1, 0) // channels
        file[7].writeUInt32LE(44100, 0) // sample rate
        file[8].writeUInt32LE(44100 * 2, 0) // byte rate
        file[9].writeUInt16LE(2, 0) // block align
        file[10].writeUInt16LE(16, 0) // bits per sample
        
        file[12].writeUInt32LE(this.samples.length * 2, 0) // data size

        for (let i = 0; i < this.samples.length; i++) {
            file.push(Buffer.alloc(2))
            file[file.length - 1].writeUInt16LE(this.samples[i], 0)
        }

        import("fs").then((fs) => {
            fs.writeFileSync("output.wav", Buffer.concat(file))
        })

    }

    getFrameAtTime(frame: number): Promise<SKIAImageData> {

        return new Promise<SKIAImageData>((resolve, reject) => {

            let frameIndex = Math.min(frame - this._start, this.frames.length - 1)
            console.log("[FRAME] Getting frame at time " + frameIndex)
            let framed = this.frames[frameIndex]

            const u8array = new Uint8ClampedArray(framed)
            const data = new SKIAImageData(u8array, this.Transform.width, this.Transform.height)
            this.frames[frameIndex] = Buffer.alloc(0)

            resolve(data)
        })
    }

    getSampleAtTime(sample: number): number {

        let sampleIndex = Math.min(sample - this._sampleStart, this.samples.length - 1)
        //console.log("[SAMPLE] Getting sample at time " + sampleIndex)
        if (sample - this._sampleStart < 0) {
            return 0
        }
        if ( sample > this._sampleStart + this.samples.length) {
            return 0
        }
        return this.samples[sampleIndex]

    }
}