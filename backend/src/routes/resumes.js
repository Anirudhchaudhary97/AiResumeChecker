const express = require("express");
const mongoose=require("mongoose");
const { z } = require("zod");

const asyncHandler=require("../utils/asyncHandler");
const ApiError=require("../utils/ApiError");
const requireAuth = require("../middleware/auth");
const {validate}=require("../middleware/validate")
const {uploadPdf}=require("../middleware/upload")



const Resume = require("../models/Resume");
const ResumeVersion = require("../models/ResumeVersion");


const {extractText}=require("../services/pdfService");
const {parseResume: parseResumeText}=require("../services/structuredParser")

const router= express.Router();
router.use(requireAuth);

const objectIdSchema=z.
string()
.refine((value)=>mongoose.Types.ObjectId.isValid(value),{
    message:"Invalid resume id"
})

const idParam= z.object({id:objectIdSchema});

const loadOwnedResume=async (req,res,next) => {
    const resume= await Resume.findOne({_id:req.params.id, user:req.user._id});
    if(!resume){
        throw ApiError.notFound("Resume not found");
    }
   return resume;
}

const loadVersion=async (resumeId, versionId) => {
    const version= await ResumeVersion.findOne({_id:versionId, resume:resumeId});
    if(!version){
        throw ApiError.notFound("Version not found");
    }
   return version;
}


// POST: create first version from uploaded PDF
router.post(
    "/",
    uploadPdf("file"),
    asyncHandler(async(req,res)=>{
        const {text, meta}=await extractText(req.file.buffer);
        const parsedSections= await parseResumeText(text);

        const title= (req.body.title || "").trim() || (req.file?.originalname ? req.file.originalname.replace(/\.pdf$/i,"") : "") || "Untitled Resume";

        const resume= await Resume.create({
            user: req.user._id,
            title,
            latestVersionNumber:1,
        });

        const version= await ResumeVersion.create({
            resume:resume._id,
            versionNumber:1,
            label:"V1",
            rawText:text,
            parsedSections,
            sourceType:"upload",
            parentVersion:null,
        });
        

        resume.currentVersionId=version._id;
        await resume.save();

        res.status(201).json({
           resume,version,meta
        })

        
    })
)


// GET: list resumes
router.get(
    "/",
    asyncHandler(async (req, res) => {
        const resumes = await Resume.find({ user: req.user._id })
            .sort({ updatedAt: -1 })
            .lean()
        res.json({resumes});
    })
);


//get by id
router.get(
    "/:id",
    validate(idParam, "params"),
    asyncHandler(async(req,res)=>{
    const resume = await loadOwnedResume(req,res);
    const versions= await ResumeVersion.find({resume:resume._id})
    .sort({versionNumber:1})
    .select("-rawText")
    .lean();

    res.json({resume,versions});
}))


router.get(
    "/:id/versions/:versionId",
    validate(
        z.object({
                id:objectIdSchema,
                versionId:objectIdSchema,
        }),
        "params"
    ),
    asyncHandler(async(req,res)=>{
        const resume= await loadOwnedResume(req,res);
        const version= await loadVersion(resume._id,req.params.versionId);
        res.json({version});
    })
);



router.delete(
    "/:id",
    validate(idParam,"params"),
    asyncHandler(async(req,res)=>{
        const resume= await loadOwnedResume(req,res);
        await ResumeVersion.deleteMany({resume:resume._id});
        await Resume.deleteOne({ _id: resume._id });
        res.json({message:"Resume deleted successfully" , ok: true});
    })
)

module.exports = router;