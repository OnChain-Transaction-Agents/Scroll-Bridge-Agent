import { DocumentClient } from "aws-sdk/clients/dynamodb";


export default class WalletService {

    private Tablename: string = "WalletTable";

    constructor(private docClient: DocumentClient) { }


    async createwallet(tba: string, email: string) {
            
            const params = {
                TableName: this.Tablename,
                Item: {
                    "TBA": tba,
                    "EMAIL": email
                }
            };
    
            try {
                const data = await this.docClient.put(params).promise();
                return data;
            } catch (err) {
                console.log(err);
                return err;
            }
    
        }

    async getWallet(TBA: string) {
            
            //get the last timestamp from the table
            const params = {
                TableName: this.Tablename,
                Key: {
                    "TBA": TBA
                }
            };
            try {
                const data = await this.docClient.get(params).promise();
                return data.Item;
            } catch (err) {
                console.log(err);
                return [];
            }
    
        }

}