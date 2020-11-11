import TeckosClient from './TeckosClient';
declare class TeckosClientWithJWT extends TeckosClient {
    private _token;
    private _initialData;
    constructor(url: string, token: string, initialData?: any);
    protected _handleOpen: () => void;
}
export default TeckosClientWithJWT;
