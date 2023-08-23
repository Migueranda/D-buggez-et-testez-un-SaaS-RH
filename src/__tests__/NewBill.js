/**
 * @jest-environment jsdom
 */

import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import router from "../app/Router.js";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import userEvent from '@testing-library/user-event'

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then bill icon mail in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const windowIcon = screen.getByTestId('icon-mail')
      expect(windowIcon.getAttribute('class')).toBe('active-icon');
    })
    test("Then i should be able to join a document with allowed extension", async () => {
      // const user = userEvent.setup;
      const file = new File(['hello'], 'hello.png', { type: 'image/png' })
      const fileInput = screen.getByTestId('file')
      expect(fileInput).toBeDefined()

      // await userEvent.upload(fileInput, file);
      userEvent.upload(fileInput, file) 

      // check array File
      expect(fileInput.files).toHaveLength(1)
      expect(fileInput.files?.item(0)).toBe(file)
    })
    /* */
    test("Then I should be able to send a new bill", () => {
      // get html page
      document.body.innerHTML = NewBillUI()
      const inputData = {
        type: "Transports", // default value
        name: "Voyage Paris", 
        date: "2023-07-20",
        amount: 850,
        vat: 60, // default value
        pct: 10,
        commentary: "trajet Paris",
        fileName: "Ficche d'investigation de fonctionalité.png",
        fileUrl: undefined,
        email: "employee@test.ltd", // default value
        status: "pending",
      }
      // -- fill all required fields to push a new bill
      // Nom de la dépense
      const inputBillName = screen.getByTestId("expense-name")
      fireEvent.change(inputBillName, { target: { value: inputData.name } })
      expect(inputBillName.value).toBe(inputData.name)
        
      // Date
      const inputBillDate = screen.getByTestId("datepicker")
      fireEvent.click(inputBillDate, { target: { value: inputData.date } })
      expect(inputBillDate.value).toBe(inputData.date)

      // Montant
      const inputBillAmount = screen.getByTestId("amount")
      fireEvent.change(inputBillAmount, { target: { valueAsNumber: inputData.amount } })
      expect(Number(inputBillAmount.value)).toBe(inputData.amount)

      // Vat
      const inputBillVat = screen.getByTestId("vat")
      fireEvent.click(inputBillVat, { target: { valueAsNumber: inputData.vat } })
      expect(Number(inputBillVat.value)).toBe(inputData.vat)

      // Pct (%)
      const inputBillPct = screen.getByTestId("pct")
      fireEvent.click(inputBillPct, { target: { valueAsNumber: inputData.pct } })
      expect(Number(inputBillPct.value)).toBe(inputData.pct)

      // File
      const fileObj = new File(['(⌐□_□)'], 'chucknorris.png', {type: 'image/png'})
      const inputBillFile = screen.getByTestId("file")
      fireEvent.change(inputBillFile, {
        target: {
          files: [fileObj],
        },
      })
      expect(inputBillFile.files).toHaveLength(1)
      expect(inputBillFile.files[0]).toBe(fileObj)

      // -- Form
      const billForm = screen.getByTestId("form-new-bill");

      // localStorage should be populated with form data
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "johndoe@email.com",
      }))

      // we have to mock navigation to test it
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
  
      const store = jest.fn();

      const newBill = new NewBill({
        document, 
        onNavigate, 
        store, 
        localStorage: window.localStorage,
      })

      const handleSubmit = jest.fn(newBill.handleSubmit)
      newBill.updateBill = jest.fn().mockResolvedValue({})
      billForm.addEventListener("submit", handleSubmit)
      fireEvent.submit(billForm)
      expect(handleSubmit).toHaveBeenCalled()
    })
    test("it should renders Bills page", () => {
      expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
    })
  })
})

// test d'intégration POST
// l'API POST correspond à l'action this.store.create présente dans la méthode handleChangeFile
describe("Given I am a user connected as Employee", () => {
  
  let newBillFormButton, logSpy
  
  const onNavigate = (pathname) => {
    document.body.innerHTML = ROUTES({ pathname });
  };

  // reset + go on newBill page (clean start)
  beforeEach( () => {
    // reset mocks
    jest.clearAllMocks()
    // mocks
    jest.spyOn(mockStore, "bills")
    logSpy = jest.spyOn(global.console, 'error')

    // set local storage
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.clear()
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee',
      email: 'johndoe@email.com',
    }))

    // loead newBill UI
    document.body.innerHTML = document.body.innerHTML = NewBillUI()

    // check for screen
    expect(screen.getAllByText('Envoyer une note de frais')).toBeTruthy()

    // assign html element submit button form from newBill page
    newBillFormButton = screen.getByTestId("form-new-bill");
  })

  describe("When I am on NewBill Page", () => {
    test("Create a new 'Note de frais' with mock API POST", async () => { 
  
      const spyUpdate = jest.spyOn(mockStore.bills(), "update")
      const store = mockStore

      const newBill = new NewBill({
        document, 
        onNavigate, 
        store, 
        localStorage: window.localStorage,
      })

      const handleSubmit = jest.fn(newBill.handleSubmit)
      newBillFormButton.addEventListener("submit", handleSubmit)
      fireEvent.submit(newBillFormButton)
      await waitFor(() => screen.getAllByText("Mes notes de frais")) // GUI 'Notes de frais'
      expect(handleSubmit).toHaveBeenCalled()
      expect(spyUpdate).toHaveBeenCalled()
    }) // end of test

    describe("When an error occurs on API", () => {
      test("Create new bill and fails with 404 message error", async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return {
            update : () =>  {
              return Promise.reject(new Error("Erreur 404"))
            }
          }})

        const newBill = new NewBill({
          document, 
          onNavigate, 
          store: mockStore, 
          localStorage: window.localStorage,
        })

        const handleSubmit = jest.fn(newBill.handleSubmit)
        newBillFormButton.addEventListener("submit", handleSubmit)
        fireEvent.submit(newBillFormButton)
        await new Promise(process.nextTick)
        expect(logSpy).toHaveBeenCalled()
        expect(logSpy).toHaveBeenCalledTimes(1)
        expect(logSpy).toHaveBeenCalledWith(new Error("Erreur 404"))
      })
      test("Create new bill and fails with 404 message error 2", async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return {
            update : () =>  {
              return Promise.reject(new Error("Erreur 500"))
            }
          }})

        const newBill = new NewBill({
          document, 
          onNavigate, 
          store: mockStore, 
          localStorage: window.localStorage,
        })

        const handleSubmit = jest.fn(newBill.handleSubmit)
        newBillFormButton.addEventListener("submit", handleSubmit)
        fireEvent.submit(newBillFormButton)
        await new Promise(process.nextTick)
        expect(logSpy).toHaveBeenCalled()
        expect(logSpy).toHaveBeenCalledTimes(1)
        expect(logSpy).toHaveBeenCalledWith(new Error("Erreur 500"))
        
      })

    }) // end describe : "When an error occurs on API"
  
  }) // end describe : "when i'm on a new bill page"

}) // end describe : Given I am a user connected as Employee
