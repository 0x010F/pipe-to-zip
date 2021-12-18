var fs            = require("fs"),
    path          = require("path"),
    express       = require("express"),
    archiver      = require("archiver"),
    { promisify } = require("util");

var app           = express(),
    port          = process.env.PORT || 8000;
    readdir       = promisify(fs.readdir)

app.get("/download/:filename", function (req, res) {
    // Grab filename from params
    if (!req.params.filename && !req.params.filename.trim()) {
      return res.status(404).json({ message: "Heck!" })
    }
    const fileName = req.params.filename
    console.log(fileName)

    // Download file
    // Ref: https://stackoverflow.com/questions/7288814/download-a-file-from-nodejs-server-using-express
    res.setHeader("Content-disposition", `attachment; filename=${fileName}.txt`)

    // Set Mime Type
    // Ref: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
    // Since its a plain text file
    res.setHeader("Content-type", "text/plain")

    const fileStream = fs.createReadStream(path.join(__dirname, "files", `${fileName}.txt`))
    fileStream.pipe(res)
})

// Send mutliple files in a zip
app.get("/multiple", async function (req, res) {
  // Create write stream
  // const output = fs.createWriteStream(path.join(__dirname, "temp", "download.zip"))
  const fileStream = fs.createReadStream(path.join(__dirname, "files", "a.txt"))
  // const anotherFileStream = fs.createReadStream(path.join(__dirname, "files", "b.txt"))

  // Read file in directory
  const files = await readdir(path.join(__dirname, "files"))

  if (files.length === 0) {
    return res.status(200).json({
      message: "No files to download"
    })
  }

  // archive.pipe(output)
  // archive.
  const archive = archiver('zip', { gzip: true, zlib: { level: 9 } })

  // Append stream
  // archive.append(fileStream, { name: "a.txt" })
  // archive.append(anotherFileStream, { name: "b.txt" })
  for (let i = 0; i < files.length; i++) {
    const fileStream = fs.createReadStream(path.join(__dirname, "files", files[i]))
    archive.append(fileStream, { name: files[i] })
  }

  archive.finalize()

  res.setHeader("Content-disposition", `attachment; filename=download.zip`)
  res.setHeader("Content-type", "application/zip")

  // TODO: Handle all archive methods

  archive.on("finish", function (error) {
    if (error) throw error;
    console.log("Archive complete")
    console.log("Deleting file")

    // Delete file
    fs.unlink(path.join(__dirname, "temp", "download.zip"), function (err) {
      if (err) throw err;
      console.log("File deleted successfully")
    })

    return res.end()
  })

  // Download
  archive.pipe(res)
})

// Listen on port
app.listen(port, function () {
  // Log
  console.log(`Server started on port ${port}`)
})
