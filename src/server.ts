import express from "express";
import { Request, Response } from "express";
import mysql from "mysql2";

const app = express();

app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Ali2023",
  database: "FlexIS",
});

db.connect((err) => {
  if (err) throw err;
  // console.log("Connected");
});

interface LoginBody {
  email: string;
  password: string;
}

interface UsersType extends LoginBody {
  employeeID: string;
  name: string;
  position: string;
  FWAStatus: string;
  status: string;
}

let response = "";

app.post("/login", (req: Request, res: Response) => {
  // console.log(">>", req.body);
  const body: LoginBody = req.body;
  if (Object.keys(body).length < 2) {
    response = JSON.stringify({ error: "missing parameters" });
    res.status(400).send(response);
    return;
  } else {
    if (!body.email) {
      response = JSON.stringify({ error: "missing email" });
      res.status(400).send(response);
      return;
    }
    if (!body.password) {
      response = JSON.stringify({ error: "missing password" });
      res.status(400).send(response);
      return;
    }
  }
  const email = body.email.toLowerCase();
  db.query(
    `SELECT * FROM Employee WHERE email = '${email}' AND password = '${body.password}'`,
    (err: any, data: UsersType[]) => {
      if (err) {
        response = JSON.stringify({ error: err });
        res.status(400).send(response);
        return;
      }
      if (data.length !== 1) {
        response = JSON.stringify({
          error: "email and password didn't match",
        });
        res.status(400).send(response);
        return;
      }
      if (data[0].status === "New") {
        response = JSON.stringify({ error: "change password" });
        res.status(400).send(response);
        return;
      }

      response = JSON.stringify({ data: data[0] });
      res.status(200).send(response);
    }
  );
});

interface ChangePasswordType {
  employeeEmail: string;
  oldPassword: string;
  newPassword: string;
}

app.post("/changePassword", (req: Request, res: Response) => {
  const body: ChangePasswordType = req.body;
  if (Object.keys(body).length < 3) {
    response = JSON.stringify({ error: "missing parameters" });
    res.status(400).send(response);
    return;
  } else {
    if (!body.employeeEmail) {
      response = JSON.stringify({ error: "missing employeeEmail" });
      res.status(400).send(response);
      return;
    }
    if (!body.oldPassword) {
      response = JSON.stringify({ error: "missing oldPassword" });
      res.status(400).send(response);
      return;
    }
    if (!body.newPassword) {
      response = JSON.stringify({ error: "missing newPassword" });
      res.status(400).send(response);
      return;
    }
  }
  const email = body.employeeEmail.toLowerCase();
  db.query(
    `SELECT * FROM Employee WHERE email = '${email}' AND password = '${body.oldPassword}'`,
    (err: any, data: UsersType[]) => {
      if (err) {
        response = JSON.stringify({ error: err });
        res.status(400).send(response);
        return;
      }
      if (data.length !== 1) {
        response = JSON.stringify({
          error: "email and password didn't match",
        });
        res.status(400).send(response);
        return;
      }
      db.query(
        `UPDATE Employee SET password = '${body.newPassword}', status = 'None' WHERE email = '${body.employeeEmail}'`,
        (err, data) => {
          if (err) {
            response = JSON.stringify({ error: err });
            res.status(400).send(response);
            return;
          }
          response = JSON.stringify({ data: "Password changed successfully" });
          res.status(200).send(response);
        }
      );
    }
  );
});

interface RegisterBody {
  email: string;
  supervisorID: string;
  name: string;
  position: string;
  departmentID: string;
  role?: string;
}

app.post("/register", (req: Request, res: Response) => {
  // console.log(">>>>", req.body);
  const body: RegisterBody = req.body;
  if (Object.keys(body).length < 4) {
    response = JSON.stringify({ error: "missing parameters" });
    res.status(400).send(response);
    return;
  } else {
    if (!body.email) {
      response = JSON.stringify({ error: "missing email" });
      res.status(400).send(response);
      return;
    }
    if (!body.name) {
      response = JSON.stringify({ error: "missing name" });
      res.status(400).send(response);
      return;
    }
    if (!body.position) {
      response = JSON.stringify({ error: "missing position" });
      res.status(400).send(response);
      return;
    }
    if (!body.departmentID) {
      response = JSON.stringify({ error: "missing departmentID" });
      res.status(400).send(response);
      return;
    }
  }
  const email = body.email.toLowerCase();
  const password = 10000000 + Math.floor(Math.random() * 10000000);

  let supervisorID = parseInt(body.supervisorID);
  const role = body.role ?? "employee";

  if (supervisorID < 1 || isNaN(supervisorID)) {
    supervisorID = 0; // no supervisor
  }

  db.query(
    `INSERT INTO Employee (email, password, name, position, FWAStatus, role, status) 
    VALUES ('${email}' , '${password}' , '${body.name}', '${body.position}', 'None', '${role}', 'New') `,
    (err: any, data: any) => {
      if (err) {
        response = JSON.stringify({ error: err });
        res.status(400).send(response);
        return;
      }
      // console.log("OK>>", data);
      db.query(
        `SELECT employeeID FROM Employee WHERE email = '${email}'`,
        (err: any, data: { employeeID: number }[]) => {
          // console.log("ID>>>>", err, data);
          if (supervisorID > 0) {
            db.query(
              `INSERT INTO EmployeeSuperVisor (supervisorID, employeeID) 
            VALUES ('${supervisorID}' , '${data[0].employeeID}')`
            );
          }
          db.query(
            `INSERT INTO DepartmentEmployee (EmployeeID, DepartmentID) 
            VALUES ('${data[0].employeeID}', '${body.departmentID}')`
          );
          response = JSON.stringify({ data: { password: password } });
          res.status(200).send(response);
        }
      );
      return;
    }
  );
});

interface DepartmentType {
  deptID: number;
  deptName: string;
}

app.post("/departments", (req: Request, res: Response) => {
  db.query(`SELECT * FROM Department`, (err: any, data: DepartmentType[]) => {
    if (err) {
      response = JSON.stringify({ error: err });
      res.status(400).send(response);
      return;
    }
    response = JSON.stringify({ data: data });
    res.status(200).send(response);
  });
});

interface GetFWAType {
  supervisorID: number;
  showHistory?: boolean;
}

app.post("/getFWA", (req: Request, res: Response) => {
  const body: GetFWAType = req.body;
  if (Object.keys(body).length < 1) {
    response = JSON.stringify({ error: "missing parameters" });
    res.status(400).send(response);
    return;
  } else {
    if (!body.supervisorID) {
      response = JSON.stringify({ error: "missing supervisorID" });
      res.status(400).send(response);
      return;
    }
  }
  const history = body.showHistory ? "" : " AND status = 'pending'";
  db.query(
    `SELECT * FROM FWARequest WHERE supervisorID = '${body.supervisorID}' ${history}`,
    (err, data) => {
      if (err) {
        response = JSON.stringify({ error: err });
        res.status(400).send(response);
        return;
      }
      response = JSON.stringify({ data: data });
      res.status(200).send(response);
    }
  );
});

interface UpdateFWAType {
  requestID: number;
  status: string;
  comment?: string;
}
app.post("/updateFWA", (req: Request, res: Response) => {
  const body: UpdateFWAType = req.body;
  if (Object.keys(body).length < 2) {
    response = JSON.stringify({ error: "missing parameters" });
    res.status(400).send(response);
    return;
  } else {
    if (!body.requestID) {
      response = JSON.stringify({ error: "missing requestID" });
      res.status(400).send(response);
      return;
    }
    if (!body.status) {
      response = JSON.stringify({ error: "missing status" });
      res.status(400).send(response);
      return;
    }
  }
  if (!(body.status === "Approved" || body.status === "Rejected")) {
    response = JSON.stringify({
      error: "status should be Approved or Rejected",
    });
    res.status(400).send(response);
    return;
  }
  let comment = body.comment ? `${body.comment}` : "";
  comment = comment.split("'").join("");
  console.log("comment>>", comment);

  db.query(
    `UPDATE FWARequest, Employee SET FWARequest.status = '${body.status}', comment = '
    ${comment}', Employee.FWAStatus =  CASE WHEN '${body.status}' = 'Approved' THEN FWARequest.workType ELSE 'None' END
    WHERE FWARequest.employeeID = Employee.employeeID AND requestID = ${body.requestID}`,
    (err, data: any) => {
      if (err) {
        response = JSON.stringify({ error: err });
        res.status(400).send(response);
        return;
      }
      if (data.affectedRows === 0) {
        response = JSON.stringify({ data: "Noting updated" });
        res.status(200).send(response);
        return;
      }

      response = JSON.stringify({ data: "FWA updated successfully" });
      res.status(200).send(response);
    }
  );
});

interface RequestFWABody {
  employeeID: string;
  workType: string;
  description: string;
  reason: string;
}

interface FWAEmployeeSuperVisorType {
  id: number;
  supervisorID: number;
  employeeID: number;
}

app.post("/requestFWA", (req: Request, res: Response) => {
  const body: RequestFWABody = req.body;
  if (Object.keys(body).length < 4) {
    response = JSON.stringify({ error: "missing parameters" });
    res.status(400).send(response);
    return;
  } else {
    if (!body.description) {
      response = JSON.stringify({ error: "missing description" });
      res.status(400).send(response);
      return;
    }
    if (!body.employeeID) {
      response = JSON.stringify({ error: "missing employeeID" });
      res.status(400).send(response);
      return;
    }
    if (!body.reason) {
      response = JSON.stringify({ error: "missing reason" });
      res.status(400).send(response);
      return;
    }
    if (!body.workType) {
      response = JSON.stringify({ error: "missing work type" });
      res.status(400).send(response);
      return;
    }
  }
  db.query(
    `SELECT * FROM EmployeeSuperVisor WHERE employeeID = '${body.employeeID}'`,
    (err: any, data: FWAEmployeeSuperVisorType[]) => {
      if (err) {
        response = JSON.stringify({ error: err });
        res.status(400).send(response);
        return;
      }
      if (data.length < 1) {
        response = JSON.stringify({ error: "no supervisor assigned" });
        res.status(400).send(response);
        return;
      }
      const supervisorID = data[0].supervisorID;
      const date = new Date().toISOString().slice(0, 19).replace("T", " ");
      body.workType = body.workType.replace("'", "");
      body.description = body.description.replace("'", "");
      body.reason = body.reason.replace("'", "");
      db.query(
        `INSERT FWARequest (employeeID, requestDate, workType, description, reason, status, comment, supervisorID) 
        VALUES('${body.employeeID}', '${date}', '${body.workType}', '${body.description}', '${body.reason}', 'Pending', '', '${supervisorID}')`,
        (err, data) => {
          if (err) {
            response = JSON.stringify({ error: err });
            res.status(400).send(response);
            return;
          }
          response = JSON.stringify({ data: "Request successfully added" });
          res.status(200).send(response);
        }
      );
    }
  );
});

app.get("/", (req: Request, res: Response) => {
  response = JSON.stringify({ data: "home" });
  res.status(200).send(response);
});

app.listen(3000, () => {
  console.log("Application started on port 3000");
});
