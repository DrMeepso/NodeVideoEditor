import { createCanvas, Canvas, SKRSContext2D } from '@napi-rs/canvas'
import { ElementModifier, Element } from "..";

export class Transform {

    public x: number = 0
    public y: number = 0

    // the canvas is always the size of the project
    // so we need to convert the element's width and height to a percentage

    public _elementWidth: number = 0
    public _elementHeight: number = 0

    public width: number = 0
    public height: number = 0

    public rotation: number = 0

    constructor()
    {
        //super()
    }

    applyToElement(element: Element, elementCanvas: Canvas): Promise<Canvas>
    {
        return new Promise((resolve, reject) => {
            const ctx = elementCanvas.getContext('2d')

            /*

            let imageData = ctx.getImageData(0, 0, elementCanvas.width, elementCanvas.height)
            ctx.clearRect(0, 0, elementCanvas.width, elementCanvas.height)

            // convert the element's width and height to a percentage
            let width = this._elementWidth / this.width
            let height = this._elementHeight / this.height

            console.log(width, height)
            console.log(element._parent.width, element._parent.height)
            ctx.scale(width, height)

            ctx.rotate(this.rotation * Math.PI / 180)

            ctx.putImageData(imageData, this.x, this.y)

            */

            resolve(elementCanvas)
        })
    }

}