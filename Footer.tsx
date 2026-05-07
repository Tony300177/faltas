const Footer = () => (
  <footer className="border-t border-border bg-background/50 backdrop-blur py-4">
    <div className="container max-w-4xl mx-auto px-4 flex flex-col gap-1 text-center text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-left">
      <span>© {new Date().getFullYear()} Controle de Faltas Escolar</span>
      <span>Desenvolvido pelo Departamento de Tecnologia da SME.</span>
    </div>
  </footer>
);

export default Footer;
