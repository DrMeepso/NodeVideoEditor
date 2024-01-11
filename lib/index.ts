import { createCanvas, Canvas, SKRSContext2D, Image, ImageData as SKIAImageData } from '@napi-rs/canvas'
import { waitForAllInstancesToClose, ffmpegRender } from './ffmpeg';
import { Transform } from './Modifiers/Transform';

export class Project
{

    public frameRate: number = 12;
    public width: number
    public height: number

    public timeline: Timeline

    constructor(width: number, height: number, frameRate: number = 12)
    {

        this.timeline = new Timeline(this)
        this.width = width
        this.height = height
        this.frameRate = frameRate
    }

    async render() //: Promise<Buffer> 
    {
        
        await waitForAllInstancesToClose()

        let sortedArray = this.timeline.elementTimeline.sort((a, b) => {
            return a.end - b.end
        })
        console.log("Reading files...")
        for (let thisElement of sortedArray) {
            // check if the element is a video
            if (thisElement.buildFrames != undefined) {
                // if it is, build the frames
                await thisElement.buildFrames()
            }
        }

        await waitForAllInstancesToClose()
        await new Promise((resolve, reject) => { setTimeout(() => { resolve(null) }, 1000) })

        console.log("Rendering frames...")
        const renderFFMPEG = ffmpegRender(this.frameRate, 'output.mp4')
        let currentFrame = 0
        
        let videoBuffer = Buffer.alloc(0)
        renderFFMPEG.stdout.on('data', (chunk: Buffer) => {
            videoBuffer = Buffer.concat([videoBuffer, chunk])
        })

        // total frames = last element's end / frame rate
        let totalFrames = sortedArray[sortedArray.length - 1].end
        console.log("Total frames: " + totalFrames)
        for (let i = 0; i < totalFrames; i++) {
            // render each frame
            console.log("Rendering frame " + currentFrame + " of " + totalFrames)
            let currentFrameData = await this.renderFrame(currentFrame)
            renderFFMPEG.stdin.write(currentFrameData)
            currentFrame += 1
        }

        renderFFMPEG.stdin.end()
        console.log("Waiting for ffmpeg to finish...")

        await waitForAllInstancesToClose()

        console.log("Done!")
        return videoBuffer

    }

    renderFrame(frame: number): Promise<Buffer>
    {
        return new Promise(async (resolve, reject) => {
            let sortedArray = this.timeline.elementTimeline.sort((a, b) => {
                return a.zIndex - b.zIndex
            })

            // get a list of all the elements that are active at this frame
            let activeElements = sortedArray.filter((element) => {
                return element._start <= frame && element.end >= frame
            })

            // render each element
            let frameCanvas = createCanvas(this.width, this.height)
            let frameCtx = frameCanvas.getContext('2d') as SKRSContext2D

            for (let thisElement of activeElements) {
                let elementCanvas = await thisElement.renderFrame(frame)

                // use the element's transform to position it on the frame

                let transform = thisElement.Transform
                let width = transform.width
                let height = transform.height

                let x = transform.x  
                let y = transform.y

                frameCtx.drawImage(elementCanvas, x, y, width, height)
                elementCanvas = {} as Canvas
            }

            let data = frameCanvas.encode('png')
            frameCanvas = {} as Canvas
            resolve(data)
        })
    }

}

// i implemented this but its not needed :/
class Timeline
{
    parent: Project

    elementTimeline: TimelineLayer = [] as TimelineLayer
    set FrameRate(value: number) {}
    get FrameRate() { return this.parent.frameRate }

    constructor(parentProject: Project)
    {
        this.parent = parentProject
    }

    addElement(element: Element, start: number)
    {
        element.Start = start
        this.elementTimeline.push(element)
        element._parent = this.parent
    }
}

interface TimelineLayer extends Array<Element>{}

export abstract class Element {
 
    public modifiers: ElementModifier[] = []

    public _parent: Project = {} as Project;

    public _start: number = 0
    public _duration: number = 0

    public zIndex: number = 0

    public end: number = 0

    constructor()
    {
        let thisTransform = new Transform()
        this.modifiers.push(thisTransform)
    }
    
    get Transform() { return this.modifiers[0] as Transform }

    // when the start or duration is changed, the end is updated
    private updateEnd() { this.end = this._start + this._duration }
    set Start(value: number){
        this._start = value
        this.updateEnd()
    }
    set Duration(value: number){
        this._duration = value
        this.updateEnd()
    }

    abstract getFrameAtTime(time: number): Promise<SKIAImageData>
    abstract buildFrames(): Promise<void>

    async renderFrame(time: number): Promise<Canvas> // needs proper return type!
    {
        let imgData = (await this.getFrameAtTime(time)) as SKIAImageData
        let canvas = createCanvas(imgData.width, imgData.height)
        let ctx = canvas.getContext('2d') as SKRSContext2D
        //@ts-ignore
        ctx.putImageData(imgData, 0, 0)
        for(let modifier of this.modifiers)
        {
            canvas = await modifier.applyToElement(this, canvas)
        }
        return canvas
    }

}

export abstract class ElementModifier {
    constructor() {}
    abstract applyToElement(element: Element, elementCanvas: Canvas): Promise<Canvas>
}