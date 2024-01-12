import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dailyService,  trackingService, hourlyService, walletService } from '../../services'
const ethers = require('ethers');
const { Alchemy, Network, Utils } = require('alchemy-sdk');
import axios from "axios";
import { abi } from "./abi";
import { tempSvg } from './base64Scroller'



const settings = {
    apiKey: 'mixbKbFHaVxJZXc3lu5a1m7phXQKKqnW',
    network: Network.ETH_SEPOLIA,
  };
  
const alchemy = new Alchemy(settings);


export const processTransactionNode = middyfy(async (): Promise<APIGatewayProxyResult>=> {
 
    const previousBatch = await trackingService.getPreviousBatch()
   
    let newMin = 0
    let newMax = 3

    if (previousBatch.length != 0) {
        newMin = previousBatch[0].MAX_TOKENS
        newMax = previousBatch[0].MAX_TOKENS + 3
    }
    


    //check if current gas price is low or high 
    const url = "https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=XM264REK2QMSGHJ2FS2A57MKV1HT4U6G55"
    const response = await axios.get(url)
    const gasMid = response.data.result.ProposeGasPrice



    //get the last 6 items based on timestamp
    const lastSix = await hourlyService.getLastSix()
    console.log('line 93', lastSix)
    //get cuurent timestamp 
    const timestamp = new Date().getTime();

    console.log('line 97', gasMid);
    const current = gasMid * 1000000000;
    const minusOne = parseInt(lastSix[0].Value_Wei);
    const minusTwo = parseInt(lastSix[1].Value_Wei);
    const minusThree = parseInt(lastSix[2].Value_Wei);
    const minusFour = parseInt(lastSix[3].Value_Wei);
    const minusFive = parseInt(lastSix[4].Value_Wei);
    const minusSix = parseInt(lastSix[5].Value_Wei);
    console.log(current, minusOne, minusTwo, minusThree);
    //https://scroll-bridge-e14e9bc6f83d.herokuapp.com/api/33000000000/23624388745/33026576679/39901160351
    ///api/<currentGas>/<one>/<two>/<three>/<four>/<five>/<six>/timestamp
    const aiUrl = `https://scroll-bridge-e14e9bc6f83d.herokuapp.com/api/${current}/${minusOne}/${minusTwo}/${minusThree}/${minusFour}/${minusFive}/${minusSix}/${timestamp}`;
    let trendNum = 0
    try {
        const aiResponse = await axios.get(aiUrl);
        trendNum = aiResponse.data.results[0];
    } catch (error) {
        console.error('Error fetching data from AI URL:', error);
    }
     
    const alchemyProvider = new ethers.providers.JsonRpcProvider(process.env.ALCHEMY_URL);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, alchemyProvider);

    const beepContract = new ethers.Contract('0x16b90303e179C4D77ECd2C28a2AB2d0c3E0bAfC7', abi, signer);
    const gasPrice = await alchemyProvider.getGasPrice()
    const batchTokens = []
    for (let i = newMin; i < newMax; i++) {
        const tx = await beepContract.getTBA(i);
        const [ tba, balance ] = tx;
        console.log('line 111', i, trendNum)
        console.log('line 113', tba.preference, tba[0]);
        console.log('line 114', balance._hex);
        const balanceAsNumber = parseInt(balance._hex, 16);
        
 
        if (balanceAsNumber != 0 && tba.preference == 1 && trendNum < .7 || balanceAsNumber != 0 && (tba.preference -1) > trendNum) {
            batchTokens.push(i)
        } 
        
      

    }
      
    console.log('initiating transaction')
    console.log('gas price', parseInt(gasPrice._hex, 16) )
    console.log('btatchTokens', batchTokens)
    if (batchTokens.length != 0) {
       const tx = await beepContract.initiateBulkBridge(
            batchTokens, 
            {
                gasPrice: parseInt(gasPrice._hex, 16)   
            }
        )
        console.log('transaction initiated', tx)
    }

    batchTokens.forEach(async (item) => {
        const wallet = await beepContract.getTBA(item)
        console.log('tba', wallet)
        const user = await walletService.getWallet(wallet.tba)
        console.log('user', user)
        sendgridMail.setApiKey(process.env.SENDGRID_API_KEY); 
    })
    
    const totalSupply = await beepContract.totalSupply();
    
    const supplyAsNumber = parseInt(totalSupply._hex, 16);
    if (supplyAsNumber > newMax) {
        await trackingService.updateBatch(newMin, newMax)
    } else {
        await trackingService.updateBatch(0, 3)
    }

    return formatJSONResponse({
        status: 200,
    });
    
    }) 




export const getPrediction= middyfy(async (): Promise<APIGatewayProxyResult>=> {
 
        const previousBatch = await trackingService.getPreviousBatch()
       
        let newMin = 0
        let newMax = 3
    
        if (previousBatch.length != 0) {
            newMin = previousBatch[0].MAX_TOKENS
            newMax = previousBatch[0].MAX_TOKENS + 3
        }
        
    
    
        //check if current gas price is low or high 
        const url = "https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=XM264REK2QMSGHJ2FS2A57MKV1HT4U6G55"
        const response = await axios.get(url)
        const gasMid = response.data.result.ProposeGasPrice
    
    
    
        //get the last 6 items based on timestamp
        const lastSix = await hourlyService.getLastSix()
        console.log('line 93', lastSix)
        //get cuurent timestamp 
        const timestamp = new Date().getTime();
    
        console.log('line 97', gasMid);
        const current = gasMid * 1000000000;
        const minusOne = parseInt(lastSix[0].Value_Wei);
        const minusTwo = parseInt(lastSix[1].Value_Wei);
        const minusThree = parseInt(lastSix[2].Value_Wei);
        const minusFour = parseInt(lastSix[3].Value_Wei);
        const minusFive = parseInt(lastSix[4].Value_Wei);
        const minusSix = parseInt(lastSix[5].Value_Wei);
        const trendCal = [(current - minusOne) / minusOne, (minusOne - minusTwo) / minusTwo, (minusTwo - minusThree) / minusThree, (minusThree - minusFour) / minusFour, (minusFour - minusFive) / minusFive, (minusFive - minusSix) / minusSix]
        console.log('trendCal', trendCal)
        const finalTrend = []
        //if the trend is positive, add 1 to the array, if negative, add -1 to the array
        trendCal.forEach((item) => {
            if (item > 0) {
                finalTrend.push(1)
            } else {
                finalTrend.push(-1)
            }
        })
        
        //https://scroll-bridge-e14e9bc6f83d.herokuapp.com/api/33000000000/23624388745/33026576679/39901160351
        ///api/<currentGas>/<one>/<two>/<three>/<four>/<five>/<six>/timestamp
        const aiUrl = `https://scroll-bridge-e14e9bc6f83d.herokuapp.com/api/${current}/${minusOne}/${minusTwo}/${minusThree}/${minusFour}/${minusFive}/${minusSix}/${timestamp}`;
        let trendNum = 0
        try {
            const aiResponse = await axios.get(aiUrl);
            trendNum = aiResponse.data.results[0];
        } catch (error) {
            console.error('Error fetching data from AI URL:', error);
        }
         
        console.log('trendNum', trendNum)
        if (trendNum < .7) {
            return formatJSONResponse({
                status: 200,
                prediction: 'low',
                trend: finalTrend
            });
        }
        if (trendNum > .7 && trendNum < 1.2) {
            return formatJSONResponse({
                status: 200,
                prediction: 'medium',
                trend: finalTrend
            });
        }
        if (trendNum > 1.2) {
            return formatJSONResponse({
                status: 200,
                prediction: 'high',
                trend: finalTrend
            });
        }

        })


export const tokenMetaData = middyfy(async (event: any): Promise<any>=> {
    const params = event.pathParameters
    
    const tokenId = params.tokenId
    
    let tester = {"name": `Scroller Pass: ${tokenId}`,
        "description": "Easily bridge to Scrool with this pass.",
        "image": tempSvg
    }
    let success_response = {
    statusCode: 200,
    headers: {
        "Access-Control-Allow-Headers" : "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
    },
    body: JSON.stringify(tester),
    };
    return success_response;

});