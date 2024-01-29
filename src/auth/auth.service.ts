import { Injectable } from "@nestjs/common";

@Injectable({})
export class AuthService {
  signup () {
    return 'signUP'
  }
  
  signin () {
    return 'signIN'
  }
}