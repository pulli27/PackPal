const User=require("../Model/userModel");
//display data
const getAllUsers = async(req,res,next)=>{
    let users;

    try{
        users = await User.find();

    } catch(err){
        console.log(err);
    }
//not found
 if(!users){
    return res.status(404).json({message:"User not found"});

    }
    //display all users
    return res.status(200).json({users});



    };
 
    //data insert
    const addUsers=async(req,res,next)=>{

        //details used in model
        const{First_Name,Last_Name,Gmail,Role,Status} = req.body;
    let users;

    try{
        users =  new User ({First_Name,Last_Name,Gmail,Role,Status});
        await users.save();
    }catch(err){
        console.log(err);
    }
   //not insert users
   if(!users){
    return res.status(404).send({message:"unable to add users"});
   }

          return res.status(200).json({users});


    };
    //Get by Id
    const getById = async(req,res,next) =>{

        const id = req.params.id;
        let users;

        try{
            users = await User.findById(id);
        }catch(err){
            console.log(err);
        }

//not available users
   if(!users){
    return res.status(404).send({message:"user not found"});
   }

          return res.status(200).json({users});


    } 

    //update user details
    const updateUser=async(req,res,next)=>{
         const id = req.params.id;
          const{First_Name,Last_Name,Gmail} = req.body;

          let users;

      try {
        users = await User.findByIdAndUpdate(id,
            {First_Name:First_Name,Last_Name:Last_Name,Gmail:Gmail});
        users= await users.save();
      }catch(err){
        console.log(err);
      }
       if(!users){
    return res.status(404).send({message:"unable to update user details"});
   }

          return res.status(200).json({users});


    };

//Delete user details
const deleteUser=async(req,res,next)=>{
    const id = req.params.id;

    let users;

    try{
        users= await User.findByIdAndDelete(id)
    }catch(err){
        console.log(err);
    } if(!users){
    return res.status(404).send({message:"unable to delete user details"});
   }

          return res.status(200).json({users});
}

exports.getAllUsers = getAllUsers;
exports.addUsers = addUsers;

exports.getById = getById;
exports.updateUser = updateUser;

exports.deleteUser = deleteUser;

