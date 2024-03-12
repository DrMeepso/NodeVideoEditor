import { createCanvas, Canvas, SKRSContext2D, ImageData as SKIAImageData } from '@napi-rs/canvas'
import { Element, Project } from '..'
import { ffmpeg, ffprobeGetDuration, ffprobeGetResolution } from '../ffmpeg';

export class Text extends Element {

    private frames: SKIAImageData[] = [];
    private parent: Project

    public text: string = "Hello World!"
    public fontSize: number = 50
    public fontFamily: string = "Arial"
    public color: string = "white"

    constructor(parentProject: Project) {
        super()
        this.parent = parentProject

        this.Transform._elementWidth = this.parent.width
        this.Transform._elementHeight = this.parent.height

        this.Transform.width = this.parent.width
        this.Transform.height = this.parent.height
    }

    buildFrames(): Promise<void> {
        // create a canvas with the text on it
        return new Promise((resolve, reject) => {

            let canvas = createCanvas(this.Transform.width, this.Transform.height)
            let ctx = canvas.getContext('2d') as SKRSContext2D

            ctx.font = `${this.fontSize}px ${this.fontFamily}`
            ctx.fillStyle = this.color
            ctx.fillText(this.text, 0, this.fontSize)

            let imgData = ctx.getImageData(0, 0, this.Transform.width, this.Transform.height)
            this.frames.push(imgData)

            resolve()
        })
    }

    getFrameAtTime(time: number): Promise<SKIAImageData> {
        return new Promise((resolve, reject) => {
            console.log("[TEXT] Getting frame at time " + time)
            resolve(this.frames[0])
        })
    }

    buildSamples(): Promise<void> {
        return new Promise((resolve, reject) => {
            resolve()
        })
    }
    getSampleAtTime(time: number): number {
        return 0
    }

}