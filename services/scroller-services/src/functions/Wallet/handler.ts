import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { walletService } from '../../services'
const ethers = require('ethers');
import axios from "axios";
import { abi } from "./abi";






export const addEmail = middyfy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log(event)
    const tbaBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const email = tbaBody.email
    const tba = tbaBody.tbaAddress
    await walletService.createwallet(tba, email)

    return formatJSONResponse({
        status: 200,
        message: "SUCCESS"
    });
}
)

export const sendEmail = middyfy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const tbaBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const token = tbaBody.token
    const alchemyProvider = new ethers.providers.JsonRpcProvider(process.env.SENDGRID_API_KEY);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, alchemyProvider);

    const beepContract = new ethers.Contract('0x16b90303e179C4D77ECd2C28a2AB2d0c3E0bAfC7', abi, signer);
    const wallet = await beepContract.getTBA(token)
    console.log('tba', wallet[0][0])
    const user = await walletService.getWallet(wallet[0][0])
    console.log('user', user)
    //sendgridMail.setApiKey(process.env.SENDGRID_API_KEY); 
    return formatJSONResponse({
        status: 200,
        message: "SUCCESS"
    });
}
)