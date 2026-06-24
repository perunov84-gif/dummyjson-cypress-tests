describe("DummyJSON API checks", () => {
  let accessToken;
  let userId;
  let firstCartId;

  const openDocsPage = (path) => {
    cy.visit(path, { timeout: 120000 });
    cy.location("host").should("eq", "dummyjson.com");
  };

  before(() => {
    // Визуально подтверждаем, что тесты работают именно с DummyJSON.
    openDocsPage("/docs/auth");

    cy.request("POST", "/auth/login", {
      username: Cypress.env("username"),
      password: Cypress.env("password"),
      expiresInMins: 30
    }).then((response) => {
      expect(response.status).to.eq(200);
      accessToken = response.body.accessToken;
      userId = response.body.id;

      cy.request("GET", `/carts/user/${userId}`).then((cartsResponse) => {
        expect(cartsResponse.status).to.eq(200);
        expect(cartsResponse.body.carts).to.be.an("array").and.not.be.empty;
        firstCartId = cartsResponse.body.carts[0].id;
      });
    });
  });

  it("1) Успешная авторизация: POST /auth/login", () => {
    openDocsPage("/docs/auth");

    cy.request("POST", "/auth/login", {
      username: Cypress.env("username"),
      password: Cypress.env("password"),
      expiresInMins: 30
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.username).to.eq(Cypress.env("username"));
      expect(response.body.accessToken).to.be.a("string").and.not.be.empty;

      accessToken = response.body.accessToken;
      userId = response.body.id;
    });
  });

  it("2) Неуспешная авторизация: неверный пароль", () => {
    openDocsPage("/docs/auth");

    cy.request({
      method: "POST",
      url: "/auth/login",
      failOnStatusCode: false,
      body: {
        username: Cypress.env("username"),
        password: "wrong-password-123",
        expiresInMins: 30
      }
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body).to.have.property("message");
    });
  });

  it("3) Получение текущего пользователя с токеном: GET /auth/me", () => {
    openDocsPage("/docs/auth");

    cy.request({
      method: "GET",
      url: "/auth/me",
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.username).to.eq(Cypress.env("username"));
      expect(response.body).to.have.property("email");
      userId = response.body.id;
    });
  });

  it("4) Получение текущего пользователя без токена: GET /auth/me", () => {
    openDocsPage("/docs/auth");

    cy.request({
      method: "GET",
      url: "/auth/me",
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(401);
    });
  });

  it("5) Получение корзин пользователя: GET /carts/user/{userId}", () => {
    openDocsPage("/docs/carts");

    cy.request("GET", `/carts/user/${userId}`).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property("carts");
      expect(response.body.carts).to.be.an("array").and.not.be.empty;
      expect(response.body.carts[0].userId).to.eq(userId);
      firstCartId = response.body.carts[0].id;
    });
  });

  it("6) Получение корзины по id: GET /carts/{cartId}", () => {
    openDocsPage("/docs/carts");

    cy.request("GET", `/carts/${firstCartId}`).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.id).to.eq(firstCartId);
      expect(response.body.products).to.be.an("array").and.not.be.empty;
    });
  });

  it("7) Создание корзины: POST /carts/add", () => {
    openDocsPage("/docs/carts");

    cy.request("POST", "/carts/add", {
      userId,
      products: [
        { id: 1, quantity: 2 },
        { id: 50, quantity: 1 }
      ]
    }).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.userId).to.eq(userId);
      expect(response.body.products).to.have.length(2);
    });
  });

  it("8) Обновление корзины: PATCH /carts/{cartId}", () => {
    openDocsPage("/docs/carts");

    cy.request("PATCH", `/carts/${firstCartId}`, {
      merge: true,
      products: [{ id: 1, quantity: 7 }]
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.id).to.eq(firstCartId);

      const updatedProduct = response.body.products.find((p) => p.id === 1);
      expect(updatedProduct).to.exist;
      expect(updatedProduct.quantity).to.eq(7);
    });
  });

  it("9) Удаление корзины: DELETE /carts/{cartId}", () => {
    openDocsPage("/docs/carts");

    cy.request("DELETE", `/carts/${firstCartId}`).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.id).to.eq(firstCartId);
      expect(response.body.isDeleted).to.eq(true);
    });
  });

  it("10) Негативная проверка корзины: несуществующий cartId", () => {
    openDocsPage("/docs/carts");

    cy.request({
      method: "GET",
      url: "/carts/999999999",
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(404);
      expect(response.body).to.have.property("message");
    });
  });
});
