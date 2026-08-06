const mongoose=require('mongoose')

const LinkSchema=new mongoose.Schema(
  {
    label:String,
    url:String,
  },
  {_id:false}
);

const basicSchema=new mongoose.Schema(
  {
    name:String,
    title:String,
    email:String,
    phone:String,
    location:String,
    links:[LinkSchema],
  },
  {_id:false}
);

const experienceSchema=new mongoose.Schema(
  {
    company:String,
    role:String,
    location:String,
    period:String,
    bullets:[String],   
  },
  {_id:false}
);


const educationSchema=new mongoose.Schema(
  {
    degree:String,
    school:String,
    location:String,
    period:String,
    details:String,
  },
  {_id:false}
)

const projectSchema=new mongoose.Schema(
  {
    name:String,
    description:String,
    tech:[String],
    links:[LinkSchema],
  },
  {_id:false}
)


const certificateSchema=new mongoose.Schema(
  {
    name:String,
    issuer:String,
    year:String,
  },
  {_id:false}
)


const parsedSectionSchema=new mongoose.Schema(
  {
    basics:{type:basicSchema,default:()=>({})},
    summary:{type:String,default:""},
    experience:{type:[experienceSchema],default:[]},
    education:{type:[educationSchema],default:[]},
    projects:{type:[projectSchema],default:[]},
    skills:{type:[String],default:[]},
    certifications:{type:[certificateSchema],default:[]},
    languages:{type:[String],default:[]},
    interests:{
      type:[String],
      default:[]
    },
  },
  {_id:false}
)


const resumeVersionSchema=new mongoose.Schema(
  {
    resumeId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Resume',
        required:true,
        index:true,
    },
    versionNumber:{
        type:Number,
        required:true,
        min:1,
    },
    label:{type:String,required:true},
    rawText:{type:String,required:true},
    parsedSchema:{type:parsedSectionSchema,default:()=>({})},
    source:{type:String,required:true, enum:['upload','rewrite']},
    parentVersion:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'ResumeVersion',
        default:null,
    },
    latestAnalysisId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Analysis',
        default:null,
    },
   
    
  },
  {timestamps:true}
)

resumeVersionSchema.index({resumeId:1,versionNumber:-1},{unique:true})

module.exports=mongoose.model('ResumeVersion',resumeVersionSchema)


