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

            // all transform actions are done when being added to the frame canvas so this is just a placeholder

            resolve(elementCanvas)
        })
    }

}