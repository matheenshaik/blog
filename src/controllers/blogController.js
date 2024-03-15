const authorModel = require("../models/authorModel")
const blogModel = require("../models/blogModel")
const mongoose = require ("mongoose");



// VALIDATION
const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};


const isValidObjectId = function (ObjectId) {
    return mongoose.Types.ObjectId.isValid(ObjectId)
}

/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>Create Blog>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/

const createBlog = async function (req, res) {

    try {
        let data = req.body
        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, msg: "body should not be empty" })
        }
        if (!isValid(data.title)) return res.status(400).send({ status: false, msg: "title is Required" })
        if (!isValid(data.body)) return res.status(400).send({ status: false, msg: "body is Required" })
        if (!isValid(data.authorId)) return res.status(400).send({ status: false, msg: "authorId is Required" })
        if (!isValidObjectId(data.authorId)) return res.status(400).send({ status: false, msg: "author id must have 24 digits" })
        if (!isValid(data.category)) return res.status(400).send({ status: false, msg: "category is Required" })

        let Id = data.authorId
        let authorId = await authorModel.findById(Id)
        if (!authorId) {
            return res.status(404).send({ status: false, msg: "authorid is not valid" })
        } 
        let savedData = await blogModel.create(data)
        res.status(201).send(savedData)
    } catch (error) {
        return res.status(500).send({ msg: error.message })

    }
}
/**>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>Get Blogs>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/

let getBlogs = async function (req, res) {
    try {
        const data = req.query;
        if (!Object.keys(data).length) {
            let blogs = await blogModel.find({ $and: [{ isDeleted: false }, { isPublished: true }] });
            if (!Object.keys(blogs).length) {
                return res.status(404).send({ status: false, msg: " No such blog exists" });
            }
            return res.status(200).send({ status: true, data: blogs });
        } else {
            let blogs = await blogModel.find({ $and: [{ isDeleted: false }, { isPublished: true }, data] });
            if (!Object.keys(blogs).length) {
                return res.status(404).send({ status: false, msg: " No such blogs exist" });
            }
            return res.status(200).send({ status: true, list: blogs });
           
        }
    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message });
    }
};

/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>Update Blogs>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/

const updateBlogs = async function (req, res) {
    try {
        let decodedId = req.decodedToken.authorId
        console.log(decodedId);
        let blogId = req.params.id
        console.log(blogId);
        let data = req.body
        let title = data.title
        let body = data.body
        let tags = data.tags
        let subcategory = data.subcategory 

        if(!isValidObjectId(blogId)) return res.status(400).send({status: false, msg: "invalid blogId"})
        
        if (Object.keys(data).length == 0) {
            return res.status(400).send({status: false, msg: "Body should not be empty" })
        }

        let validId = await blogModel.findById(blogId)
        if (!validId) {
            return res.status(400).send({ status: false, msg: "This user is not present" })
        }
        let authorId= validId.authorId
        console.log(authorId);
        if(decodedId != authorId) return res.status(403).send({status : false, message: "unauthorised access"})
        let savedData = await blogModel.findOneAndUpdate({ _id: blogId }, { $set: { title: title, body: body,  isPublished: true, publishedAt: Date.now() } ,
        $push:{  tags:tags, subcategory:subcategory}}, { new: true })
        res.status(200).send({status: true, msg: "blog updated successfuly", data: savedData})


    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}


/**********************************************Deleted*******************************************************************/
const deleted = async function (req, res) {
    try {
        let decodedId = req.decodedToken.authorId
        console.log(decodedId);
        let blogId = req.params.id
        console.log(blogId);
       
        if(!isValidObjectId(blogId)) return res.status(400).send({status: false, msg: "invalid blogId"})

        let blog = await blogModel.findById(blogId)
        if (!isValid(blog)) {
            return res.status(404).send({ status: false, msg: "blog not found" })
        }
        let authorId= blog.authorId
        console.log(authorId);
        if(decodedId != authorId) return res.status(403).send({status : false, message: "unauthorised access"})

        if (blog.isDeleted == true) {
            return res.status(404).send({ status: false, msg: "this blog is already deleted" })
        }
        if (blog.isDeleted == false) {
            let deletetion = await blogModel.findByIdAndUpdate({ _id: blogId }, { $set: { isDeleted: true, deletedAt: new Date() } })
            return res.status(200).send({ status: true, msg: "blog is deleted successfully" })
        }

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}

/************************************************Query Deleted***********************************************************/
const queryDeleted = async function (req, res) {
    try {
        let decodedId = req.decodedToken.authorId
        console.log(decodedId);
        const { category, authorId, isPublished, tags, subcategory } = req.query
        const result = { isDeleted: false , isPublished: false}
        if(decodedId != authorId) return res.status(403).send({status : false, message: "unauthorised access"})


        if (Object.keys(req.query).length == 0) {
            return res.status(400).send({ status: false, msg: "No blog to be deleted" })
        }
        let blogs = await blogModel.find({ authorId: authorId }).select({ _id: 1, isDeleted: 1 })

 
        if (!blogs) {
            return res.status(404).send({ status: false, msg: "Blog document doesn't exists." })
        }
        if (category) {
            result.category = category
        }

        if (tags) {
            result.tags = { $in: [tags] }
        }

        if (subcategory) {
            result.subCategory = { $in: [subcategory] }
        }

        if (isPublished) {
            result.isPublished = isPublished
        }
        const blog = await blogModel.find(result)
        if (!blog.length ) {
            return res.status(200).send({ status: true, msg: "This blog is already deleted." })
        }

        const updateData = await blogModel.updateMany(result, { isDeleted: true, deletedAt: Date.now() } ,{new: true})

        return res.status(200).send({ status: true, Data: updateData })
    } catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, msg: error.message })
    }
}





module.exports.createBlog = createBlog
module.exports.getBlogs = getBlogs
module.exports.updateBlogs = updateBlogs
module.exports.deleted = deleted
module.exports.queryDeleted = queryDeleted

