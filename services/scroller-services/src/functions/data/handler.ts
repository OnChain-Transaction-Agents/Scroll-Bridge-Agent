import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dailyService, hourlyService } from '../../services'
import axios from "axios";




//createDailyAverage
export const createDailyAverage = middyfy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log(event)
    const fullDay = await hourlyService.getFullDay()
    const oneDay = fullDay[0].DATE

    const hourlyRates = await hourlyService.getHourlyRates(oneDay)
    console.log('hourlyRates', hourlyRates)
    const average = hourlyRates.reduce((a, b) => a + b.Value_Wei, 0) / hourlyRates.length;
    //create daily average
    console.log('average', Math.round(average))
    await dailyService.createDailyAverage(Math.round(average))
    //update the hourly rates to be recorded
    await hourlyService.updateHourlyRates(hourlyRates)

    return formatJSONResponse({
        status: 200,
        message: "SUCCESS"
    });
})

//fetchHourlyGasPrice
export const createHourlyRate = middyfy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log(event)
    const url = "https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=XM264REK2QMSGHJ2FS2A57MKV1HT4U6G55"
    const response = await axios.get(url)
    const gasPrice = response.data.result.suggestBaseFee
    //convert result from wei to gwei 
    console.log(gasPrice)
    const gasPriceGwei = gasPrice
    await hourlyService.createHourlyRate(gasPriceGwei)
    return formatJSONResponse({
        status: 200,
        message: "SUCCESS"
    });
})



