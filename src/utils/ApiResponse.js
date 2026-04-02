class ApiResponse{
    constructor(message="success",data,statuscode){
        this.message=message
        this.data=data
        this.statuscode=statuscode
        this.success=statuscode<400
    }
}
export {ApiResponse}