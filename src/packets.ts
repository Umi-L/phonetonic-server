interface packet{
    method: string
}

export interface ConnectionPacket extends packet{
    username:string
}

export interface ConnectionPacketResponse extends packet{
    uuid:number;
}