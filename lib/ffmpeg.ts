import { spawn } from "child_process";
import { Writable } from "stream";

interface ffmpegExec {
    dataPipe: Writable,
    infoPipe: Writable,
    promies: Promise<void>
}

const info = {
    "FFInstances": 0
}

export function ffmpeg(prams: string[]){
    
    //console.log("FFMPEG_PATH: " + process.env["FFMPEG_PATH"]!)

    let ffmpeg = spawn(process.env["FFMPEG_PATH"]!, prams)
    info.FFInstances++
    ffmpeg.on('close', () => {
        info.FFInstances--
    })
    return ffmpeg

}

export function ffprobe(prams: string[]){
    
    //console.log("FFPROBE_PATH: " + process.env["FFPROBE_PATH"]!)

    let ffprobe = spawn(process.env["FFPROBE_PATH"]!, prams)
    info.FFInstances++
    ffprobe.on('close', () => {
        info.FFInstances--
    })
    return ffprobe

}

export function ffmpegRender(frameRate: number, outputName: string) {
    // return a ffmpeg instance that will take in pngimages and output a video

    return ffmpeg([
        '-f',
        'image2pipe',
        '-r',
        frameRate.toString(),
        '-i',
        '-',
        '-vcodec',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        '-crf',
        '18',
        '-preset',
        'veryslow',
        outputName
    ])

}

export function waitForAllInstancesToClose() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if(info.FFInstances == 0){
                console.log("All instances closed!")
                resolve(null)
            }
        }, 100)
    })
}

export async function ffprobeGetDuration(file: string): Promise<number> {

    return new Promise((resolve, reject) => {

        let ffprobeExec = ffprobe([
            '-v',
            'error',
            '-show_entries',
            'format=duration',
            '-of',
            'default=noprint_wrappers=1:nokey=1',
            file
        ])

        let duration: number = 0

        ffprobeExec.stdout.on('data', (chunk) => {
            duration = parseFloat(chunk.toString())
        })

        ffprobeExec.stderr.on('data', (chunk) => {
            //console.log(chunk.toString())
        })

        ffprobeExec.on('close', () => {
            resolve(duration)
        })

    })

}

export async function ffprobeGetResolution(file: string): Promise<{width: number, height: number}> {

    return new Promise((resolve, reject) => {

        let ffprobeExec = ffprobe([
            '-v',
            'error',
            '-select_streams',
            'v:0',
            '-show_entries',
            'stream=width,height',
            '-of',
            'csv=s=x:p=0',
            file
        ])

        let resolution = {width: 0, height: 0}

        ffprobeExec.stdout.on('data', (chunk) => {
            let res = chunk.toString().split('x')
            resolution.width = parseInt(res[0])
            resolution.height = parseInt(res[1])
        })

        ffprobeExec.stderr.on('data', (chunk) => {
            //console.log(chunk.toString())
        })

        ffprobeExec.on('close', () => {
            resolve(resolution)
        })

    })

}