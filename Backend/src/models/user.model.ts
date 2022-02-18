import { Schema, model, Document, Model} from "mongoose";
import bcrypt from "bcrypt"

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    calendars: Schema.Types.ObjectId[];
    invitations: Schema.Types.ObjectId[];
    comparePasswords(password: string): Promise<boolean>;
}

interface IUserModel extends Model<IUser>{
    encriptPassword(password: string):  Promise<string>;
}

const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
        lowercase: true,
        min: 3
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        min: 3,
    },
    calendars: [ 
        {
            type: Schema.Types.ObjectId,
            ref: "Calendar"
        }
    ],
    invitations: [
        {
            type: Schema.Types.ObjectId,
            ref: "Invitations"
        }
    ]
}, {
    timestamps: true,
    versionKey: false
})

UserSchema.statics.encriptPassword = async (password: string):Promise<string> =>  {
    const salt = await bcrypt.genSalt(10)
    const hashed_pass = bcrypt.hash(password, salt)
    return hashed_pass
}

UserSchema.methods.comparePasswords = async function (password: string): Promise<boolean>{
    const isValidPass = await bcrypt.compare(password, this.password)
    return isValidPass
}


export default model<IUser, IUserModel>("User", UserSchema)
