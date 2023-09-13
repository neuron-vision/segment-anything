
function uploadImage(files) {
    //const input = document.getElementById('imageInput');
    if (!files.length) {
        alert("Please select an image first!");
        return;
    }

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);

    fetch('http://127.0.0.1:5000/embeddings', {
        method: 'POST',
        body: formData
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "grayscale_output.jpg";
        a.click();
    })
    .catch(error => console.error('Error uploading image:', error));
}

