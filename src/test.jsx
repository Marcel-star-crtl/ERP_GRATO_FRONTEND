.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background: #000000;
    padding: 20px;
    max-width: 1000px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
  }
  
  .flex-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
  }
  
  .modal-content img {
    height: auto;
    max-height: 550px;
    max-width: 45%;
    margin-right: 20px;
  }
  
  .text-container {
    flex-grow: 1;
  }
  
  .text-container h1,
  .text-container p {
    color: #ffffff;
    width: 100%;
    box-sizing: border-box;
  }
  
  .modal-content h1 {
    color: #ffffff;
    text-decoration: underline;
    padding: 20px 0;
  }
  
  .modal-content p {
    color: #ffffff;
  }
  
  .close-button {
    color: white;
    position: absolute;
    top: 10px;
    left: 10px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 20px;
  }
  

  /* Media Queries */
/* @media (max-width: 1050px) {
  .cards {
    padding: 0px 10px 40px 10px;
  }
  .card-header {
    width: 200px;
    height: 200px !important;
  }
} */


/* @media (max-width: 768px) {
  .cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    padding: 0px 10px 40px 10px;
  }

  .card-header {
    width: calc(50% - 20px) !important;
    height: 150px !important;
  }
} */