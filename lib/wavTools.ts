export function renderSamplesToWavFile(samples: number[], outputName: string) {
    
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

    file[1].writeUInt32LE(44 + (samples.length * 2), 0) // file size

    file[4].writeUInt32LE(16, 0) // fmt size
    file[5].writeUInt16LE(1, 0) // format
    file[6].writeUInt16LE(1, 0) // channels
    file[7].writeUInt32LE(44100, 0) // sample rate
    file[8].writeUInt32LE(44100 * 2, 0) // byte rate
    file[9].writeUInt16LE(2, 0) // block align
    file[10].writeUInt16LE(16, 0) // bits per sample
    
    file[12].writeUInt32LE(samples.length * 2, 0) // data size

    for (let i = 0; i < samples.length; i++) {
        file.push(Buffer.alloc(2))
        file[file.length - 1].writeUInt16LE(samples[i], 0)
    }

    import("fs").then((fs) => {
        fs.writeFileSync(`${outputName}.wav`, Buffer.concat(file))
    })

}