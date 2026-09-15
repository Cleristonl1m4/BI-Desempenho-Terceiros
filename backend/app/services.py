import logging
from typing import List, Optional
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import text
from decimal import Decimal, ROUND_HALF_UP
from .schemas import CapacidadeIndicadores
from .exceptions import DatabaseError

logger = logging.getLogger(__name__)


class BeneficiadorService:

    def __init__(self, db: Session):
        self.db = db

    def _round_decimal(self, value: Optional[float], decimals: int = 2) -> Optional[float]:
        if value is None:
            return None
        decimal_value = Decimal(str(value))
        rounded = decimal_value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        return float(rounded)

    def _calcular_dias_periodo(self, data_inicio: date, data_fim: date) -> int:
        delta = data_fim - data_inicio
        return max(delta.days + 1, 1)

    def _classificar_capacidade(self, disponibilidade_percentual: Optional[float]) -> str:
        if disponibilidade_percentual is None:
            return "Baixa"
        if disponibilidade_percentual > 40:
            return "Alta"
        elif disponibilidade_percentual >= 20:
            return "Média"
        return "Baixa"

    def _executar_consulta_capacidade(self):
        hoje = date.today()
        if hoje.month <= 6:
            data_inicio = date(hoje.year - 1, 7, 1)
            data_fim = date(hoje.year - 1, 12, 31)
        else:
            data_inicio = date(hoje.year, 1, 1)
            data_fim = date(hoje.year, 6, 30)

        sql = """
        SELECT
          a.cd_beneficiador,
          a.desc_beneficiador,
          a.cd_material,
          a.desc_material,
          a.especif1,
          SUM(a.MPRO_QT_FABRICADA) / 6.0 AS TOTAL_MPRO_QT_FABRICADA,
          MAX(a.DT_INICIAR_OP) AS ULTIMA_DT_INICIAR_OP
        FROM (
          select
            op.op, op.Dt_criacao, op.Liberacao, op.Cd_material, mat.Descricao desc_material,
            mat.Cd_grupo, mat.Cd_sub_grupo, mat.Cd_especif3, mat.Cd_especif4,
            op.cd_cliente, cli.nome_completo desc_cliente, OP.QUANTIDADE_OP,
            op.Especif1, op.Numeracao, op.Lote,
            OP.MPRO_Qt_fabricada,
            OP.MPRO_Qt_DEFEITO,
            OP.MPRO_Qt_PERDIDA,
            op.SITUACAO_OP,
            OP.DT_RETORNO DT_RETORNO,
            op.Dt_iniciar_OP,
            OP.cd_beneficiador,
            isnull(benef.Nome_completo, '') desc_beneficiador,
            case when op.SERIE_NF_SAIDA=' ' then null else OP.SERIE_NF_SAIDA end SERIE_NF_SAIDA,
            ISNULL(NULLIF(LTRIM(RTRIM(SUBSTRING(op.SERIE_NF_SAIDA, CHARINDEX('/', op.SERIE_NF_SAIDA) + 1, 20))), ''), '0') AS NF,
            OP.dt_final,
            OP.saldo_OP,
            case when 'S' = 'S' then substring(isnull((DBO.cg_fc_monta_descr_ident(op.Especif1,DBO.cg_fc_monta_descr_ident(op.Especif1,'',1, 0,' ',0,' '),0,0, ' ',0, ' ')),' '),0,255) else ' ' end desc_completa,
            0 + ROW_NUMBER() OVER(ORDER BY op.op DESC) Chave,
            Row_Number() Over(Partition by op.op Order By op.op desc) T1,
            'REP018' CHAVE2
          from (
            SELECT
              MAX(X.LIBERACAO) LIBERACAO,
              X.OP,
              MAX(X.DT_CRIACAO) DT_CRIACAO,
              MAX(X.CD_MATERIAL) CD_MATERIAL,
              MAX(X.CD_CLIENTE) CD_CLIENTE,
              MAX(X.QUANTIDADE_OP) QUANTIDADE_OP,
              MAX(X.ESPECIF1) ESPECIF1,
              MAX(X.NUMERACAO) NUMERACAO,
              MAX(X.LOTE) LOTE,
              MAX(X.SITUACAO_OP) SITUACAO_OP,
              MAX(X.DT_INICIAR_OP) DT_INICIAR_OP,
              MAX(X.SALDO_OP) SALDO_OP,
              ISNULL(X.CD_BENEFICIADOR,' ') CD_BENEFICIADOR,
              SUM(X.MPRO_QT_FABRICADA) MPRO_QT_FABRICADA,
              SUM(X.MPRO_QT_DEFEITO) MPRO_QT_DEFEITO,
              SUM(X.MPRO_QT_PERDIDA) MPRO_QT_PERDIDA,
              X.SERIE_NF_SAIDA,
              X.DT_FINAL,
              X.DT_RETORNO
            FROM (
              SELECT
                OP.LIBERACAO LIBERACAO,
                OP.OP,
                OP.DT_CRIACAO DT_CRIACAO,
                OP.CD_MATERIAL CD_MATERIAL,
                OP.CD_EMPRESA CD_CLIENTE,
                OP.QUANTIDADE QUANTIDADE_OP,
                OP.ESPECIF1 ESPECIF1,
                OP.NUMERACAO NUMERACAO,
                OP.LOTE LOTE,
                OP.SITUACAO SITUACAO_OP,
                OP.DT_INICIAR DT_INICIAR_OP,
                OP.QUANTIDADE-(OP.QT_FABRICADA+OP.QT_DEFEITO+OP.QT_PERDIDA) SALDO_OP,
                ISNULL(MPRO.CD_EMPRESA,' ') CD_BENEFICIADOR,
                CASE WHEN MPRO.TIPO = 'F' THEN ISNULL(MV.QUANTIDADE,0) ELSE 0 END MPRO_Qt_fabricada,
                CASE WHEN MPRO.TIPO = 'D' THEN ISNULL(MV.QUANTIDADE,0) ELSE 0 END MPRO_Qt_DEFEITO,
                CASE WHEN MPRO.TIPO = 'P' THEN ISNULL(MV.QUANTIDADE,MPRO.Quantidade) ELSE 0 END MPRO_Qt_PERDIDA,
                ISNULL((SELECT TOP 1 RTRIM(MSAI.SERIE) + '/' + RTRIM(CAST(MSAI.NF AS VARCHAR(20)))
                  from PCMVTOOP m WITH(NOLOCK)
                  INNER JOIN ESMOVIME MSAI WITH(NOLOCK) ON MSAI.Movimento = M.Movimento
                  where m.op = MPRO.OP
                    AND M.Tipo = 'F'
                    AND MSAI.CD_EMPRESA = MPRO.CD_EMPRESA
                    AND MSAI.Tipo_movimento = 'S'
                    AND MSAI.NF <> 0),' ') SERIE_NF_SAIDA,
                MPRO.DT_FINAL,
                MV.Dt_movimento DT_RETORNO,
                ISNULL(MV.Movimento,0) MOVIMENTO_ENT
              FROM PCORPROD op with(nolock)
              INNER JOIN ESMATERI MAT WITH (NOLOCK) ON MAT.CD_MATERIAL = OP.CD_MATERIAL
              LEFT JOIN PCMOPROD MPRO with(nolock) ON MPRO.OP = OP.OP
              LEFT JOIN PCMVTOOP MVOP WITH (NOLOCK) ON MVOP.Op = MPRO.Op
                AND MVOP.Talao = MPRO.Talao
                AND MVOP.liberacao = op.liberacao
                AND (MVOP.CAMPO9 = MPRO.Dt_final or mpro.Dt_final is null and MVOP.CAMPO9 is null)
                AND (MVOP.Hora_Final_Mvto_OP = MPRO.Hora_final or mpro.Hora_final is null and MVOP.Hora_Final_Mvto_OP is null)
                AND (MVOP.Tipo IN ('R','E') AND MVOP.CAMPO17 = MPRO.Tipo OR MPRO.TIPO = MVOP.Tipo)
                AND MVOP.Movimento <> 0
              LEFT JOIN ESMOVIME MV WITH (NOLOCK) ON MV.Movimento = MVOP.Movimento
              WHERE (MV.Tipo_movimento = 'E' AND MV.Cd_material = OP.Cd_material OR MV.Movimento IS NULL)
                AND mat.Cd_grupo = '06'
                AND MV.dt_movimento BETWEEN :data_inicio AND :data_fim
            ) X
            GROUP BY
              X.OP,
              ISNULL(X.CD_BENEFICIADOR,' '),
              X.DT_FINAL,
              ISNULL(X.MOVIMENTO_ENT,0),
              X.SERIE_NF_SAIDA,
              X.DT_RETORNO
          ) OP
          LEFT JOIN geempres benef with(nolock) ON benef.cd_empresa = OP.cd_BENEFICIADOR
          LEFT JOIN geempres cli with(nolock) ON cli.cd_empresa = op.CD_CLIENTE
          INNER JOIN esmateri mat with(nolock) ON mat.cd_material = op.Cd_material
        ) A
        WHERE A.CD_BENEFICIADOR != ''
          AND A.CD_BENEFICIADOR NOT IN ('78209','78308','00760','00784')
          AND A.NF <> '0'
        GROUP BY
          a.cd_beneficiador,
          a.desc_beneficiador,
          a.cd_material,
          a.desc_material,
          a.especif1
        """
        params = {"data_inicio": data_inicio, "data_fim": data_fim}
        result = self.db.execute(text(sql), params)
        return result.fetchall()

    def _executar_consulta_alocamento(self):
        sql = """
        select
          a.cd_material,
          a.desc_material,
          a.cd_grupo,
          a.cd_sub_grupo,
          a.SALDO_OP AS quantidade_alocada,
          a.especif1,
          a.dt_retorno,
          a.DT_INICIAR_OP AS data_inicio,
          a.cd_beneficiador,
          a.desc_beneficiador
        FROM (
        select op.op, op.Dt_criacao, op.Liberacao, op.Cd_material, mat.Descricao desc_material, mat.Cd_grupo, mat.Cd_sub_grupo, mat.Cd_especif3, mat.Cd_especif4, op.cd_cliente, cli.nome_completo desc_cliente, OP.QUANTIDADE_OP, op.Especif1, op.Numeracao, op.Lote,
               OP.MPRO_Qt_fabricada,
               OP.MPRO_Qt_DEFEITO,
               OP.MPRO_Qt_PERDIDA, op.SITUACAO_OP,
               OP.DT_RETORNO DT_RETORNO,
          op.Dt_iniciar_OP, OP.cd_beneficiador, isnull(benef.Nome_completo,
                       '') desc_beneficiador,
               case when op.SERIE_NF_SAIDA=' ' then null else OP.SERIE_NF_SAIDA end SERIE_NF_SAIDA,
               ISNULL(NULLIF(LTRIM(RTRIM(SUBSTRING(op.SERIE_NF_SAIDA, CHARINDEX('/', op.SERIE_NF_SAIDA) + 1, 20))), ''), '0') AS NF,
               OP.dt_final,
               OP.saldo_OP,
              case when 'S' = 'S' then  substring(isnull((DBO.cg_fc_monta_descr_ident(op.Especif1,DBO.cg_fc_monta_descr_ident(op.Especif1,'',1, 0,' ',0,' '),0,0, ' ',0, ' ')),' '),0,255) else ' ' end  desc_completa,
                      28  + ROW_NUMBER() OVER(ORDER BY op.op DESC) Chave,
              Row_Number() Over(Partition by op.op Order By op.op desc) T1,
             'REP018' CHAVE2
          from (SELECT MAX(X.LIBERACAO) LIBERACAO,
          X.OP,
          MAX(X.DT_CRIACAO) DT_CRIACAO,
          MAX(X.CD_MATERIAL) CD_MATERIAL,
          MAX(X.CD_CLIENTE) CD_CLIENTE,
          MAX(X.QUANTIDADE_OP) QUANTIDADE_OP,
          MAX(X.ESPECIF1) ESPECIF1,
          MAX(X.NUMERACAO) NUMERACAO,
          MAX(X.LOTE) LOTE,
          MAX(X.SITUACAO_OP) SITUACAO_OP,
          MAX(X.DT_INICIAR_OP) DT_INICIAR_OP,
          MAX(X.SALDO_OP) SALDO_OP,
          ISNULL(X.CD_BENEFICIADOR,' ') CD_BENEFICIADOR,
          SUM(X.MPRO_QT_FABRICADA) MPRO_QT_FABRICADA,
          SUM(X.MPRO_QT_DEFEITO) MPRO_QT_DEFEITO,
          SUM(X.MPRO_QT_PERDIDA) MPRO_QT_PERDIDA,
          X.SERIE_NF_SAIDA,
          X.DT_FINAL,
          X.DT_RETORNO
        FROM  (SELECT OP.LIBERACAO LIBERACAO,
           OP.OP,
           OP.DT_CRIACAO DT_CRIACAO,
           OP.CD_MATERIAL CD_MATERIAL,
           OP.CD_EMPRESA CD_CLIENTE,
           OP.QUANTIDADE QUANTIDADE_OP,
           OP.ESPECIF1 ESPECIF1,
           OP.NUMERACAO NUMERACAO,
           OP.LOTE LOTE,
           OP.SITUACAO SITUACAO_OP,
           OP.DT_INICIAR DT_INICIAR_OP,
           OP.QUANTIDADE-(OP.QT_FABRICADA+OP.QT_DEFEITO+OP.QT_PERDIDA) SALDO_OP,
           ISNULL(MPRO.CD_EMPRESA,' ') CD_BENEFICIADOR,
           CASE WHEN MPRO.TIPO = 'F' THEN ISNULL(MV.QUANTIDADE,0)
             ELSE 0 END MPRO_Qt_fabricada,
           CASE WHEN MPRO.TIPO = 'D' THEN ISNULL(MV.QUANTIDADE,0)
             ELSE 0 END MPRO_Qt_DEFEITO,
           CASE WHEN MPRO.TIPO = 'P' THEN ISNULL(MV.QUANTIDADE,MPRO.Quantidade)
             ELSE 0 END MPRO_Qt_PERDIDA,
          ISNULL((SELECT TOP 1 RTRIM(MSAI.SERIE) + '/' + RTRIM(CAST(MSAI.NF AS VARCHAR(20)))
             from PCMVTOOP m WITH(NOLOCK)
            INNER JOIN ESMOVIME MSAI WITH(NOLOCK)
               ON MSAI.Movimento = M.Movimento
            where m.op = MPRO.OP
              AND M.Tipo = 'F'
              AND MSAI.CD_EMPRESA= MPRO.CD_EMPRESA
              AND MSAI.Tipo_movimento = 'S'
              AND MSAI.NF <> 0),' ') SERIE_NF_SAIDA,
           MPRO.DT_FINAL,
           MV.Dt_movimento DT_RETORNO,
            ISNULL(MV.Movimento,0) MOVIMENTO_ENT
          FROM PCORPROD op  with(nolock)
           INNER JOIN ESMATERI MAT WITH (NOLOCK) ON MAT.CD_MATERIAL = OP.CD_MATERIAL
           LEFT JOIN PCMOPROD MPRO  with(nolock) ON MPRO.OP = OP.OP
            LEFT JOIN PCMVTOOP MVOP WITH (NOLOCK) ON MVOP.Op = MPRO.Op AND MVOP.Talao = MPRO.Talao
             AND MVOP.liberacao = op.liberacao
             AND (MVOP.CAMPO9=MPRO.Dt_final or mpro.Dt_final is null and MVOP.CAMPO9 is null  )
                 AND (MVOP.Hora_Final_Mvto_OP=MPRO.Hora_final  or mpro.Hora_final is null and MVOP.Hora_Final_Mvto_OP is null )
                 AND (MVOP.Tipo IN ('R','E') AND  MVOP.CAMPO17=MPRO.Tipo OR MPRO.TIPO=MVOP.Tipo)
                    AND MVOP.Movimento<>0
           LEFT JOIN ESMOVIME MV WITH (NOLOCK) ON MV.Movimento = MVOP.Movimento
           WHERE (MV.Tipo_movimento='E' AND MV.Cd_material = OP.Cd_material
                       OR MV.Movimento IS NULL
                     )
              and op.situacao = 'L'
              ) X
            GROUP BY X.OP,ISNULL(X.CD_BENEFICIADOR,' '),X.DT_FINAL,ISNULL(X.MOVIMENTO_ENT,0),X.SERIE_NF_SAIDA,X.DT_RETORNO
                ) OP
          left join geempres benef with(nolock)
            on benef.cd_empresa = OP.cd_BENEFICIADOR
          left join geempres cli with(nolock)
            on cli.cd_empresa = op.CD_CLIENTE
         inner join esmateri mat with(nolock)
            on mat.cd_material = op.Cd_material
         ) A
         WHERE A.CD_GRUPO = '06'
           AND A.CD_BENEFICIADOR NOT IN ('78209','78308','00760','00784')
           AND A.NF <> '0'
        """
        result = self.db.execute(text(sql))
        return result.fetchall()

    def _executar_consulta_tempo_producao(self):
        sql = """
        SELECT
            a.cd_beneficiador,
            a.desc_beneficiador,
            a.cd_material,
            a.especif1,
            CASE
                WHEN AVG(CASE
                    WHEN a.dt_retorno IS NOT NULL AND a.dt_criacao IS NOT NULL
                    THEN DATEDIFF(DAY, a.dt_criacao, a.dt_retorno)
                    ELSE NULL
                END) IS NOT NULL
                THEN CAST(AVG(CASE
                    WHEN a.dt_retorno IS NOT NULL AND a.dt_criacao IS NOT NULL
                    THEN DATEDIFF(DAY, a.dt_criacao, a.dt_retorno)
                    ELSE NULL
                END) AS INT)
                ELSE 0
            END AS media_tempo_producao_dias
        FROM (
            SELECT
                op.op,
                op.Dt_criacao,
                op.Cd_material,
                op.Especif1,
                op.DT_RETORNO,
                op.cd_beneficiador,
                ISNULL(benef.Nome_completo, '') AS desc_beneficiador,
                mat.Descricao AS desc_material
            FROM (
                SELECT
                    X.OP,
                    MAX(X.DT_CRIACAO) AS DT_CRIACAO,
                    MAX(X.CD_MATERIAL) AS CD_MATERIAL,
                    X.ESPECIF1,
                    X.DT_RETORNO,
                    ISNULL(X.CD_BENEFICIADOR, ' ') AS CD_BENEFICIADOR
                FROM (
                    SELECT
                        OP.OP,
                        OP.DT_CRIACAO,
                    OP.CD_MATERIAL,
                    OP.ESPECIF1,
                    MV.Dt_movimento AS DT_RETORNO,
                        ISNULL(MPRO.CD_EMPRESA, ' ') AS CD_BENEFICIADOR
                    FROM PCORPROD OP WITH (NOLOCK)
                    INNER JOIN ESMATERI MAT WITH (NOLOCK)
                        ON MAT.CD_MATERIAL = OP.CD_MATERIAL
                    LEFT JOIN PCMOPROD MPRO WITH (NOLOCK)
                        ON MPRO.OP = OP.OP
                    LEFT JOIN PCMVTOOP MVOP WITH (NOLOCK)
                        ON MVOP.Op = MPRO.Op
                        AND MVOP.Talao = MPRO.Talao
                        AND MVOP.liberacao = op.liberacao
                        AND (MVOP.CAMPO9 = MPRO.Dt_final OR (MPRO.Dt_final IS NULL AND MVOP.CAMPO9 IS NULL))
                        AND (MVOP.Hora_Final_Mvto_OP = MPRO.Hora_final OR (MPRO.Hora_final IS NULL AND MVOP.Hora_Final_Mvto_OP IS NULL))
                        AND MVOP.Tipo IN ('R', 'E')
                        AND MVOP.Movimento <> 0
                    LEFT JOIN ESMOVIME MV WITH (NOLOCK)
                        ON MV.Movimento = MVOP.Movimento
                        AND MV.Tipo_movimento = 'E'
                        AND MV.Cd_material = OP.Cd_material
                    WHERE
                        MAT.Cd_grupo = '06'
                ) X
                 GROUP BY X.OP, X.DT_RETORNO, ISNULL(X.CD_BENEFICIADOR, ' '), X.CD_MATERIAL, X.ESPECIF1
            ) OP
            LEFT JOIN geempres benef WITH (NOLOCK)
                ON benef.cd_empresa = OP.cd_BENEFICIADOR
            INNER JOIN ESMATERI mat WITH (NOLOCK)
                ON mat.cd_material = OP.Cd_material
        ) A
        WHERE A.CD_BENEFICIADOR NOT IN ('78209','78308','00760','00784')
        GROUP BY
            a.cd_beneficiador,
            a.desc_beneficiador,
            a.cd_material,
            a.desc_material,
            a.especif1
        """
        result = self.db.execute(text(sql))
        return result.fetchall()

    def _executar_consulta_tempo_producao_novo(self):
        sql = """
        SELECT
            a.cd_beneficiador,
            ISNULL(benef.NOME_COMPLETO, '') AS desc_beneficiador,
            a.cd_material,
            a.especif1,
            CAST(AVG(a.tempo_medio_dias) AS INT) AS media_tempo_producao_dias
        FROM (
            SELECT
                op.cd_material,
                op.especif1,
                op.dt_retorno,
                op.cd_beneficiador,
                CASE
                    WHEN f.Dt_emissao IS NOT NULL AND op.dt_retorno IS NOT NULL
                    THEN DATEDIFF(DAY, f.Dt_emissao, op.dt_retorno)
                    ELSE NULL
                END AS tempo_medio_dias
            FROM (
                SELECT
                    X.OP,
                    MAX(X.CD_MATERIAL) AS cd_material,
                    MAX(X.ESPECIF1) AS especif1,
                    MAX(X.DT_RETORNO) AS dt_retorno,
                    MAX(X.SERIE_NF_SAIDA) AS serie_nf_saida,
                    MAX(X.CD_BENEFICIADOR) AS cd_beneficiador
                FROM (
                    SELECT
                        OP.OP,
                        OP.CD_MATERIAL,
                        OP.ESPECIF1,
                        MV.Dt_movimento AS DT_RETORNO,
                        ISNULL((
                            SELECT TOP 1 RTRIM(MSAI.SERIE) + '/' + RTRIM(CAST(MSAI.NF AS VARCHAR(20)))
                            FROM PCMVTOOP m WITH(NOLOCK)
                            INNER JOIN ESMOVIME MSAI WITH(NOLOCK)
                                ON MSAI.Movimento = M.Movimento
                            WHERE m.op = MPRO.OP
                              AND M.Tipo = 'F'
                              AND MSAI.CD_EMPRESA = MPRO.CD_EMPRESA
                              AND MSAI.Tipo_movimento = 'S'
                              AND MSAI.NF <> 0
                        ), ' ') AS SERIE_NF_SAIDA,
                        ISNULL(MPRO.CD_EMPRESA, ' ') AS CD_BENEFICIADOR
                    FROM PCORPROD OP WITH(NOLOCK)
                    INNER JOIN ESMATERI MAT WITH(NOLOCK)
                        ON MAT.CD_MATERIAL = OP.CD_MATERIAL
                    LEFT JOIN PCMOPROD MPRO WITH(NOLOCK)
                        ON MPRO.OP = OP.OP
                    LEFT JOIN PCMVTOOP MVOP WITH(NOLOCK)
                        ON MVOP.Op = MPRO.Op
                        AND MVOP.liberacao = op.liberacao
                        AND (MVOP.CAMPO9 = MPRO.Dt_final OR (MPRO.Dt_final IS NULL AND MVOP.CAMPO9 IS NULL))
                        AND (MVOP.Hora_Final_Mvto_OP = MPRO.Hora_final OR (MPRO.Hora_final IS NULL AND MVOP.Hora_Final_Mvto_OP IS NULL))
                        AND MVOP.Tipo IN ('R', 'E')
                        AND MVOP.Movimento <> 0
                    LEFT JOIN ESMOVIME MV WITH(NOLOCK)
                        ON MV.Movimento = MVOP.Movimento
                        AND MV.Tipo_movimento = 'E'
                        AND MV.Cd_material = OP.Cd_material
                    WHERE MAT.Cd_grupo = '06'
                      AND MV.dt_movimento BETWEEN :data_inicio AND :data_fim
                ) X
                GROUP BY X.OP
            ) op
            INNER JOIN FANFISCA f WITH(NOLOCK)
                ON f.Nf = ISNULL(NULLIF(LTRIM(RTRIM(SUBSTRING(
                    op.serie_nf_saida,
                    CHARINDEX('/', op.serie_nf_saida) + 1,
                    20
                ))), ''), '0')
        ) a
        LEFT JOIN GEEMPRES benef WITH(NOLOCK)
            ON benef.CD_EMPRESA = a.cd_beneficiador
        WHERE a.CD_BENEFICIADOR NOT IN ('78209', '78308', '00760', '00784')
        GROUP BY
            a.cd_beneficiador,
            benef.NOME_COMPLETO,
            a.cd_material,
            a.especif1
        """
        hoje = date.today()
        if hoje.month <= 6:
            data_inicio = date(hoje.year - 1, 7, 1)
            data_fim = date(hoje.year - 1, 12, 31)
        else:
            data_inicio = date(hoje.year, 1, 1)
            data_fim = date(hoje.year, 6, 30)
        result = self.db.execute(
            text(sql),
            {"data_inicio": data_inicio, "data_fim": data_fim},
        )
        return result.fetchall()

    def _executar_consulta_material_beneficiador(self):
        """Retorna os beneficiadores que produzem cada material."""
        sql = """
        SELECT DISTINCT
            MAT.CD_MATERIAL,
            MAT.DESCRICAO AS desc_material,
            OP.ESPECIF1,
            ISNULL(BENEF.CD_EMPRESA, ' ') AS cd_beneficiador,
            ISNULL(BENEF.NOME_COMPLETO, '') AS desc_beneficiador
        FROM PCORPROD OP WITH(NOLOCK)
        INNER JOIN ESMATERI MAT WITH(NOLOCK)
            ON MAT.CD_MATERIAL = OP.CD_MATERIAL
        LEFT JOIN PCMOPROD MPRO WITH(NOLOCK)
            ON MPRO.OP = OP.OP
        LEFT JOIN GEEMPRES BENEF WITH(NOLOCK)
            ON BENEF.CD_EMPRESA = MPRO.CD_EMPRESA
        WHERE OP.SITUACAO NOT IN ('C', 'F')
          AND MAT.CD_GRUPO = '06'
          AND MPRO.CD_EMPRESA NOT IN ('78209','78308','00760','00784', '')
        ORDER BY MAT.CD_MATERIAL, cd_beneficiador
        """
        result = self.db.execute(text(sql))
        return result.fetchall()

    def load_all_data(self) -> dict:
        """Executa as queries e retorna os resultados para o cache."""
        try:
            capacidades = self._executar_consulta_capacidade()
            alocamentos = self._executar_consulta_alocamento()
            tempos = self._executar_consulta_tempo_producao_novo()
            material_relacoes = self._executar_consulta_material_beneficiador()
            return {
                "capacidades": capacidades,
                "alocamentos": alocamentos,
                "tempos": tempos,
                "material_relacoes": material_relacoes,
            }
        except Exception as e:
            logger.error("Erro ao carregar dados: %s", str(e))
            raise DatabaseError("Erro ao carregar dados dos beneficiadores")

    def processar_indicadores(
        self,
        capacidades: list,
        alocamentos: list,
        tempos: list,
        material: Optional[str] = None,
        especif1: Optional[str] = None,
    ) -> List[CapacidadeIndicadores]:
        """Processa os dados brutos em indicadores consolidados."""
        if material is not None:
            material = str(material).strip()
            capacidades = [
                row for row in capacidades
                if str(row.cd_material).strip() == material
                and (especif1 is None or str(row.especif1 or '').strip() == especif1)
            ]
            alocamentos = [
                row for row in alocamentos
                if str(row.cd_material).strip() == material
                and (especif1 is None or str(row.especif1 or '').strip() == especif1)
            ]
            tempos = [
                row for row in tempos
                if str(row.cd_material).strip() == material
                and (especif1 is None or str(row.especif1 or '').strip() == especif1)
            ]
        hoje = date.today()
        if hoje.month <= 6:
            data_inicio = date(hoje.year - 1, 7, 1)
            data_fim = date(hoje.year - 1, 12, 31)
        else:
            data_inicio = date(hoje.year, 1, 1)
            data_fim = date(hoje.year, 6, 30)
        dias_periodo = self._calcular_dias_periodo(data_inicio, data_fim)

        beneficiadores_dict = {}

        for cap in capacidades:
            benef_id = cap.cd_beneficiador
            if benef_id not in beneficiadores_dict:
                beneficiadores_dict[benef_id] = {
                    'nome': cap.desc_beneficiador,
                    'capacidade_media': float(cap.TOTAL_MPRO_QT_FABRICADA),
                    'ultima_data_inicio': None,
                    'alocacoes': [],
                    'data_inicios': [],
                    'tempos': [],
                }
            else:
                beneficiadores_dict[benef_id]['capacidade_media'] += float(cap.TOTAL_MPRO_QT_FABRICADA)

        for aloc in alocamentos:
            benef_id = aloc.cd_beneficiador
            if benef_id not in beneficiadores_dict:
                continue
            beneficiadores_dict[benef_id]['alocacoes'].append({
                'quantidade': float(aloc.quantidade_alocada),
                'material': aloc.cd_material,
                'desc_material': aloc.desc_material,
                'data_inicio': aloc.data_inicio,
            })
            if aloc.data_inicio:
                beneficiadores_dict[benef_id]['data_inicios'].append(aloc.data_inicio)
                if (
                    beneficiadores_dict[benef_id]['ultima_data_inicio'] is None
                    or aloc.data_inicio > beneficiadores_dict[benef_id]['ultima_data_inicio']
                ):
                    beneficiadores_dict[benef_id]['ultima_data_inicio'] = aloc.data_inicio

        for tempo in tempos:
            benef_id = tempo.cd_beneficiador
            if benef_id not in beneficiadores_dict:
                continue
            beneficiadores_dict[benef_id].setdefault('tempos', []).append(tempo.media_tempo_producao_dias)

        resultados = []
        for benef_id, dados in beneficiadores_dict.items():
            capacidade_media = dados.get('capacidade_media')
            if capacidade_media is None or capacidade_media == 0:
                capacidade_media = None

            producao_total = sum(a['quantidade'] for a in dados['alocacoes']) if dados['alocacoes'] else 0.0

            if capacidade_media is not None:
                disponibilidade = capacidade_media - producao_total
            else:
                disponibilidade = None

            if capacidade_media is not None and capacidade_media > 0:
                disponibilidade_percentual = (disponibilidade / capacidade_media) * 100
            else:
                disponibilidade_percentual = None

            ultima_data_inicio = dados.get('ultima_data_inicio')
            if not ultima_data_inicio and dados['data_inicios']:
                ultima_data_inicio = max(dados['data_inicios'])

            media_pecas_dia = producao_total / dias_periodo if dias_periodo > 0 else 0.0
            situacao = self._classificar_capacidade(disponibilidade_percentual)

            resultado = CapacidadeIndicadores(
                beneficiador_id=benef_id,
                beneficiador_nome=dados['nome'],
                capacidade_media_mensal=self._round_decimal(capacidade_media),
                producao_total_alocada=self._round_decimal(producao_total),
                disponibilidade=self._round_decimal(disponibilidade),
                disponibilidade_percentual=self._round_decimal(disponibilidade_percentual),
                ultima_data_inicio=ultima_data_inicio,
                media_pecas_dia=self._round_decimal(media_pecas_dia),
                media_tempo_producao_dias=(
                    round(sum(dados['tempos']) / len(dados['tempos']))
                    if dados.get('tempos') else None
                ),
                situacao_capacidade=situacao,
            )
            resultados.append(resultado)

        return resultados
