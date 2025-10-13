import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();
import { sendEmailOTP } from '../services/otpService.js';
import validator from 'validator';
import bcrypt from 'bcrypt';

const signUp = async (req, res) => {
    try {
        const { email, phone, password } = req.body;

        //Checking Email,Phone & Password 
        if (!email || !phone || !password) {
            return res.status(400).json({ error: "Enter All required fields." })
        }

        //Validation all the credentials
        function validateCreds(email, phone, password) {
            if (!validator.isEmail(email)) {
                return res.status(400).json({ error: "Invalid email address." })
            }

            if (!validator.isMobilePhone(phone)) {
                return res.status(400).json({ error: "Invalid phone number." })
            }

            if (!validator.isStrongPassword(password)) {
                return res.status(400).json({ error: "Password is not strong enough" })
            }
        }

        validateCreds(email,phone,password)

        const hashedPassword = await bcrypt.hash(password,10);

    }
    catch (err) {
        res.status(500).json({ error: "Error Occured while Sign Up", error: err.message });
    }
}


export { signUp }