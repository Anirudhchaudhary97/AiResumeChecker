const {PDFParse} = require('pdf-parse');
const ApiError = require("../utils/ApiError");


const extractText = async (pdfBuffer) => {
    let parser;
    try{
        parser=new PDFParse({data: pdfBuffer});
        const result = await parser.getText();

        const text= (result.text || "").trim();
        if(!text || text.length<50){
        throw ApiError.badRequest("Could not extract readable text - is this a scanned/image-only PDf?");
        } 

        return {
            text,
            meta:{
              numPages:  result.pages?.length ?? result.numPages ?? null,
            }
        }
    }
    catch(err){
        if(err.isOperational){
            throw err;
        }
        throw ApiError.badRequest("failed to parse PDF");
    }finally{
        try{
          await parser?.destroy();
        }catch{
        //   noop
        }
    }

}

module.exports = {
    extractText
}