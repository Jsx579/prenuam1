from .models import Factor, Calificacion

# Lista de nombres de factores, basándonos en tu CSV (Factores 8 al 37, 29 en total)
NOMBRES_FACTORES = [f"Factor {i}" for i in range(8, 38)] 

def inicializar_factores(calificacion_instance: Calificacion):
    """Crea los 29 modelos Factor enlazados a una Calificacion recién creada."""
    factores_a_crear = []
    for nombre in NOMBRES_FACTORES:
        # Crea un objeto Factor sin guardarlo aún
        factores_a_crear.append(
            Factor(
                calificacion=calificacion_instance,
                nombre=nombre,
                valor=0.00000000 # Valor inicial nulo/cero
            )
        )
    # Crea todos los objetos Factor en una sola consulta
    Factor.objects.bulk_create(factores_a_crear)
    pass