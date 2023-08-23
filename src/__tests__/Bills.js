/**
 * @jest-environment jsdom
 */

import {getByTestId, getByText, screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills, billsWithNullDates } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import router from "../app/Router.js";
import Bills from "../containers/Bills.js"
import userEvent from '@testing-library/user-event'

// _______________________________________________


// _______________________________________________

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')

      expect(windowIcon.getAttribute('class')).toBe('active-icon');

    })

    //title
    test("It should renders Bills page vertical navbar", () => {
      // expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
      expect(screen.getAllByText("Billed")).toBeTruthy();
    });

    // MPIE - 20230816 - ajout du test pour les dates null
    test("null date in bills should not be formated", () => {
      document.body.innerHTML = BillsUI({ data: billsWithNullDates })
      const nullDates = screen.getAllByText("null").map(a => a.innerHTML)
      expect(nullDates.length).toBe(4)
    })
       
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      
      expect(dates).toEqual(datesSorted)
    })

    test("I should be able to click on an action", async () => {

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      const billsContainer = new Bills({
        document, onNavigate, store: null, bills: bills, localStorage: window.localStorage
      })
      document.body.innerHTML = BillsUI({ data: bills })

      const icon1 = document.querySelector(`div[data-testid="icon-eye"]`)
      expect(icon1).toBeTruthy()

      const handleClickIconEye1 = jest.fn((e) => billsContainer.handleClickIconEye(icon1))

      icon1.addEventListener('click', handleClickIconEye1)
      userEvent.click(icon1)
      expect(handleClickIconEye1).toHaveBeenCalled()
      
      const modale = screen.getByTestId('modaleFile')
      expect(modale).toBeTruthy()
    })

    test("I should be able to click to create a new bill", async () => {

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      const billsContainer = new Bills({
        document, onNavigate, store: null, bills: bills, localStorage: window.localStorage
      })
      document.body.innerHTML = BillsUI({ data: bills })

      const btn1 = document.querySelector(`button[data-testid="btn-new-bill"]`)
      expect(btn1).toBeTruthy()
      const handleClickNewBill1 = jest.fn((e) => billsContainer.handleClickNewBill())

      btn1.addEventListener('click', handleClickNewBill1)
      userEvent.click(btn1)
      expect(handleClickNewBill1).toHaveBeenCalled()
    })
  })

  describe("When I am on Bills Page but there is no bill", () => {
    test("Then, nothing should be displayed", async () => {

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      const billsContainer = new Bills({
        document, onNavigate, store: null, bills: [], localStorage: window.localStorage
      })
      document.body.innerHTML = BillsUI({ data: [] })

      const htmlTbody = document.querySelector(`tbody[data-testid="tbody"]`)
      expect(htmlTbody).toBeTruthy()
      // console.log(htmlTbody.innerHTML.trim().length)
      expect(htmlTbody.innerHTML.trim()).toBe('')
    })
  })

  describe('When I am on Bills page but it is loading', () => {
    test('Then, Loading page should be rendered', () => {
      document.body.innerHTML = BillsUI({ loading: true })
      expect(screen.getAllByText('Loading...')).toBeTruthy()
    })
  })

  describe('When I am on Bills page but back-end send an error message', () => {
    test('Then, Error page should be rendered', () => {
      document.body.innerHTML = BillsUI({ error: 'some error message' })
      expect(screen.getAllByText('Erreur')).toBeTruthy()
    })
  })

})

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: 'Employee' }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      // await until bill screen is displayed (with "Mes notes de frais" check)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      // check if we have displayed bills
      const htmlTbody = document.querySelector(`tbody[data-testid="tbody"]`)
      expect(htmlTbody).toBeTruthy()
      const totalBills = htmlTbody.querySelectorAll('tr').length
      expect(totalBills > 0).toBeTruthy()
    })
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "johndoe@test.ltd"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })
    test("fetches bills from an API and fails with 404 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("fetches messages from an API and fails with 500 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})

      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
  
  })
})

// pour voir les console.log dans le terminal : npm run test --silent=false
