import { asyncHandler } from "../middlewares/errorHandler.js";
import { sendSuccess } from "../utils/response.js";


export const ping = asyncHandler(async (req,res)=>{
    //Return minimal response for fast RTT calculation

    return sendSuccess(
        res,
        {
            timestamp: new Date().toISOString(), // for time sync
            serverTime: new Date().getTime(),
        },
        "pong"
    );
});