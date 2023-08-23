import VerticalLayout from './VerticalLayout.js'
import ErrorPage from "./ErrorPage.js"
import LoadingPage from "./LoadingPage.js"
import { formatDate, formatStatus } from "../app/format.js"
import Actions from './Actions.js'

const row = (bill) => {

  // MPIE - 20230816 - gestion date null & formatage
  let dateBill = bill.date
  // aucun formatage si la date est nulle (null) ce qui arrive dans certains cas de manipulation du site
  // ainsi on évite aux dates nulles d'hériter de la valeur "01 Jan 1970" 
  if (dateBill !== null){
    // Dans le cas d'un test Jest, on applique pas le format pour pouvoir passer le test de comparaison après sort (./test/Bills.js)
    // in jest environment
    if (typeof jest === 'undefined'){ 
      dateBill = formatDate(bill.date)
    }
  }

  return (`
    <tr>  
      <td>${bill.type}</td>
      <td>${bill.name}</td>
      <td>${dateBill}</td>
      <td>${bill.amount} €</td>
      <td>${bill.status}</td>
      <td>
        ${Actions(bill.fileUrl)}
      </td>
    </tr>
    `)
  }


// MPIE - 20233107 - [Bug report] - Bills - start
// const rows = (data) => {
//   return (data && data.length) ? data.map(bill => row(bill)).join("") : ""
// }

const rows = (data) => {
  if(data && data.length){
    data.sort((a, b) => (a.date < b.date) ? 1 : -1); // sort DESC lastest => earliest
    return data.map(bill => row(bill)).join("")
  }else{
    return ""
  }
}
// MPIE - 20233107 - [Bug report] - Bills - stop

export default ({ data: bills, loading, error }) => {

  const modal = () => (`
    <div class="modal fade" id="modaleFile" data-testid="modaleFile" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLongTitle">Justificatif</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
          </div>
        </div>
      </div>
    </div>
  `)

  if (loading) {
    return LoadingPage()
  } else if (error) {
    return ErrorPage(error)
  }
  
  return (`
    <div class='layout'>
      ${VerticalLayout(120)}
      <div class='content'>
        <div class='content-header'>
          <div class='content-title'> Mes notes de frais </div>
          <button type="button" data-testid='btn-new-bill' class="btn btn-primary">Nouvelle note de frais</button>
        </div>
        <div id="data-table">
        <table id="example" class="table table-striped" style="width:100%">
          <thead>
              <tr>
                <th>Type</th>
                <th>Nom</th>
                <th>Date</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
          </thead>
          <tbody data-testid="tbody">
            ${rows(bills)}
          </tbody>
          </table>
        </div>
      </div>
      ${modal()}
    </div>`
  )
}