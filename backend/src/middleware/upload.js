const multer = require("multer");
const ApiError = require("../utils/ApiError");

const MAX_FILE_SIZE = 5 * 1024 * 1024; //5MB

//we use memory storage
//multer will store the file in memory as a buffer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, //allow only one file upload
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(ApiError.badRequest("Only PDF files are allowed"));
    }
  },
});


//upload pdf file
const uploadPdf =
  (feild = "file") =>
  (req, res, next) => {
    upload.single(feild)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(
            ApiError.badRequest("File size is too large. Max limit is 5MB"),
          );
        }

        return next(ApiError.badRequest(err.message));
      }
      if(err) return next(err);
      if(!req.file) return next(ApiError.badRequest("Please upload a file"));
      next();
    });
  };


  module.exports = {
    uploadPdf,
  };