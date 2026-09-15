from fastapi import HTTPException, status

class BeneficiadorNotFoundError(HTTPException):
    def __init__(self, beneficiador_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Beneficiador com ID '{beneficiador_id}' não encontrado"
        )

class DatabaseError(HTTPException):
    def __init__(self, detail: str = "Erro ao acessar o banco de dados"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail
        )