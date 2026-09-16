# Prompt 1.1
## Generate BDD E2E Specifications for the "positions” Page
Desempeña el cargo de ingeniero sénior de QA especialista en BDD con amplia experiencia en Playwright, TypeScript y Gherkin.
Tu tarea consiste en definir las especificaciones BDD para las pruebas E2E de una página web llamada «positions».
El resultado de esta tarea debe ser un conjunto de especificaciones .feature de Gherkin que posteriormente se implementarán utilizando:
* Playwright
* TypeScript
* Definiciones de pasos (.ts)
* Objetos de página
Importante
En esta etapa, NO generes código de Playwright, definiciones de pasos, objetos de página, selectores, localizadores ni código de TypeScript.

El único objetivo es definir el comportamiento esperado de la aplicación utilizando Gherkin.

Los escenarios BDD en formato Gherkin:
Feature:
Scenario: 
Given 
When 
Then 
…
Los escenarios deben cubrir : 
1) happy path, positions carga correctamente.
2) Que el título de la posición se muestra correctamente.
3) Que se muestran las columnas correspondientes a cada fase del proceso de contratación.
4) Que las tarjetas de los candidatos se muestran en la columna correcta según su fase actual.
5) Las fases exactas deben coincidir con las implementadas en la interfaz por cada position


# Promp 1.2
Lee features/positions.feature y genera los step definitions en TypeScript usando playwright-bdd. Usa queries accesibles (getByRole, getByLabel). Si el step ya existe en features/steps/, no lo dupliques.

Valida que las pruebas siguen las convenciones y buenas prácticas
* Selectores estables: usar atributos data-testid para localizar elementos.
* Nombres descriptivos: cada prueba describe claramente el escenario y el resultado esperado.
* Validación doble: estado visual de la UI + comunicación con el backend.
* Sin datos quemados frágiles: los datos de prueba son controlados y fáciles de actualizar.
Ejemplo de atributos data-testid recomendados en la interfaz:
<div data-testid="position-title"></div>

# Prompt 1.3
Genere y ejecute las pruebas, muéstrame el reporte final.

# Promp 2.1
## Generate BDD E2E Specifications para cambio de fase de un candidato
Desempeña el cargo de ingeniero sénior de QA especialista en BDD con amplia experiencia en Playwright, TypeScript y Gherkin.
Tu tarea consiste en definir las especificaciones BDD para las pruebas E2E de la página web del kanban con las fases de una posición con 
sus candidatos y estados por fase.
El resultado de esta tarea debe ser un conjunto de especificaciones .feature de Gherkin que posteriormente se implementarán utilizando:
* Playwright
* TypeScript
* Definiciones de pasos (.ts)
* Objetos de página
Importante
En esta etapa, NO generes código de Playwright, definiciones de pasos, objetos de página, selectores, localizadores ni código de TypeScript.

El único objetivo es definir el comportamiento esperado de la aplicación utilizando Gherkin.

Los escenarios BDD en formato Gherkin:
Feature:
Scenario: 
Given 
When 
Then 
…
Los escenarios deben cubrir : 
1) happy path, simule el movimiento de un candidato de una fase a otra. 
2) Que se puede arrastrar una tarjeta de candidato desde una columna hacia otra.
3) Que la tarjeta del candidato aparece visualmente en la nueva columna.
4) Que la fase del candidato se actualiza correctamente y queda guardada

# Prompt 2.2
Lee features/candidate-phase-transition.feature  y genera los step definitions en TypeScript usando playwright-bdd. Usa queries accesibles (getByRole, getByLabel). Si el step ya existe en features/steps/, no lo dupliques. NO genere ni ejecute las pruebas.

La prueba debe validar que al mover el candidato:
* Se dispara una petición PUT.  (I guess PUT /candidate/:id)
* El id del candidato corresponde al candidato movido.
* El body de la petición contiene la nueva fase.
* La respuesta del backend es exitosa.

Valida que las pruebas siguen las convenciones y buenas prácticas
* Selectores estables: usar atributos data-testid para localizar elementos.
* Nombres descriptivos: cada prueba describe claramente el escenario y el resultado esperado.
* Validación doble: estado visual de la UI + comunicación con el backend.
* Sin datos quemados frágiles: los datos de prueba son controlados y fáciles de actualizar.
Ejemplo de atributos data-testid recomendados en la interfaz:
<div data-testid="position-title"></div>
<div data-testid="phase-column-applied"></div>
<div data-testid="phase-column-interview"></div>
<div data-testid="candidate-card-1"></div>

# Prompt 2.3
Genere y ejecute las pruebas, muéstrame el reporte final.