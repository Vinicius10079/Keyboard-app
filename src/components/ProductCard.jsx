function ProductCard({ id, name, image, link, onLinkChange }) {
  const handleClick = async () => {
    const result = await window.electronAPI.launchExe(link);

    if (!result.success) {
      console.error("Erro ao abrir o programa:", result.error);
    }
  };

  const handleEditPath = async (e) => {
    e.stopPropagation(); // evita disparar o launch ao clicar em "Alterar caminho"

    const result = await window.electronAPI.selectExe();
    if (result.canceled) return;

    const saveResult = await window.electronAPI.saveLink(id, result.filePath);
    if (saveResult.success) {
      onLinkChange(id, result.filePath);
    } else {
      console.error("Erro ao salvar o caminho:", saveResult.error);
    }
  };

  return (
    <div className="product-wrapper">
      <button className="product" onClick={handleClick}>
        <div className="product-card">
          <img src={image} alt={name} />
        </div>
      </button>
      <br/>
      <button className="edit-path-btn" onClick={handleEditPath} title={link}>
        Alterar caminho
      </button>
      <br/>
      -
    </div>
  );
}

export default ProductCard;
