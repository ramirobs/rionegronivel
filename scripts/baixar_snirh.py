import urllib.request
import urllib.parse
from http.cookiejar import CookieJar
import ssl
import re
import sys

def baixar_serie_historica(data_inicio, data_fim, output_file="dados_exportados.xls"):
    print(f"Iniciando download de {data_inicio} até {data_fim}...")
    
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    cookie_jar = CookieJar()
    opener = urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(cookie_jar),
        urllib.request.HTTPSHandler(context=ctx)
    )
    urllib.request.install_opener(opener)

    # Passo 1: Acessar a página inicial para iniciar a sessão do ASP.NET
    url_default = "https://www.snirh.gov.br/hidrotelemetria/Default.html"
    try:
        urllib.request.urlopen(urllib.request.Request(url_default))
    except Exception:
        pass

    # Passo 2: Definir o cookie via AJAX (Obrigatório no SNIRH)
    url_cookie = "https://www.snirh.gov.br/hidrotelemetria/Default.aspx/SetCookie"
    req1 = urllib.request.Request(url_cookie, data=b"", method='POST')
    req1.add_header('Content-Type', 'application/json; charset=utf-8')
    req1.add_header('Accept', 'application/json')
    try:
        urllib.request.urlopen(req1)
    except Exception:
        pass

    # Passo 3: Acessar a página da série histórica e pegar o ViewState
    base_url = "https://www.snirh.gov.br/hidrotelemetria/serieHistorica.aspx"
    
    # Parâmetros baseados na URL do Rio Negro
    params = {
        'estCodigo': '260649480',
        'codEstacao': '65100001',
        'Page': 'Compartilhar',
        'txtPeriodoDe': data_inicio,
        'txtPeriodoDeHr': '00:00',
        'txtPeriodoA': data_fim,
        'txtPeriodoAHr': '23:59',
        'rbTipo': '2',
        'filtrarPor': 'Pesquisa',
        'txtPesquisa': 'rio negro',
        'lstEstados': '22',
        'lstOrigem': '0',
        'lstBacia': '0',
        'lstSub': '0',
        'chkStatus': '0',
        'idEstacao': '260649480',
        'rbPeriodoDiario': '180'
    }
    
    url_serie = f"{base_url}?{urllib.parse.urlencode(params)}"
    
    try:
        with urllib.request.urlopen(urllib.request.Request(url_serie)) as response:
            html = response.read().decode('utf-8')
    except Exception as e:
        print("Erro ao acessar serieHistorica:", e)
        return

    def extract_hidden(name):
        match = re.search(f'id="{name}" value="(.*?)"', html)
        if not match:
            match = re.search(f'name="{name}" value="(.*?)"', html)
        return match.group(1) if match else ""

    viewstate = extract_hidden("__VIEWSTATE")
    eventvalidation = extract_hidden("__EVENTVALIDATION")
    viewstategenerator = extract_hidden("__VIEWSTATEGENERATOR")

    if not viewstate:
        print("Erro: Não foi possível obter o __VIEWSTATE da página.")
        return

    # Passo 4: Fazer o POST simulando o clique no botão de Exportar (Excel)
    print("Gerando o arquivo Excel...")
    post_data = {
        '__EVENTTARGET': '',
        '__EVENTARGUMENT': '',
        '__VIEWSTATE': viewstate,
        '__VIEWSTATEGENERATOR': viewstategenerator,
        '__EVENTVALIDATION': eventvalidation,
        'ctl00$cphCorpo$hdfExportar': '1', 
        'ctl00$cphCorpo$btExportar.x': '15',
        'ctl00$cphCorpo$btExportar.y': '15'
    }

    encoded_data = urllib.parse.urlencode(post_data).encode('utf-8')
    req_post = urllib.request.Request(url_serie, data=encoded_data, method='POST')

    try:
        with urllib.request.urlopen(req_post) as response:
            content = response.read()
            with open(output_file, "wb") as f:
                f.write(content)
            print(f"Sucesso! Arquivo salvo como: {output_file} ({len(content) / 1024 / 1024:.2f} MB)")
    except Exception as e:
        print("Erro durante a exportação:", e)

if __name__ == "__main__":
    # Defina o período que você quer extrair para o seu simulador de enchentes
    # Exemplo: 20 anos de dados
    baixar_serie_historica("01/01/2000", "18/08/2026", "rio_negro_historico.xls")
