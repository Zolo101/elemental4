import { ElementalLoadingUi} from "../../elem";
import {NV7ElementalAPI} from "./nv7";

export async function login(api: NV7ElementalAPI, ui?: ElementalLoadingUi): Promise<boolean> {
  var email = api.saveFile.get("email", "default")
  var password = api.saveFile.get("password", "default")
  if (email == "default" || password == "default") {
    var registering = false;
    while (true) {
      ui.status("Requesting Login Info", 0);
      let creds = await api.ui.dialog({
        title: 'Nv7 Elemental Login',
        parts: [
          {
            id: "email",
            type: "email",
            placholder: "example@example.com",
            required: true,
          },
          {
            id: "password",
            type: "password",
            required: true,
          }
        ],
        buttons: [
          {
            id: 1,
            label: (!registering && "Log In") || (registering && "Register"),
          },
          {
            id: 0,
            label: (!registering && "Register") || (registering && "Log In"),
          },
          !registering && {
            id: -2,
            label: "Anonymous"
          },
          {
            id: -1,
            label: "Cancel",
          }
        ].filter(Boolean)
      });

      ui.status("Processing Login Info", 0);

      if (creds["button"] == 1) {
        ui.status("Authenticating", 0);
        if (registering) {
          resp = await fetch(api.prefix + "create_user/" + encodeURIComponent(creds["email"]) + "/" + encodeURIComponent(creds["password"]))
        } else {
          resp = await fetch(api.prefix + "login_user/" + encodeURIComponent(creds["email"]) + "/" + encodeURIComponent(creds["password"]))
        }

        ui.status("Authenticating", 0.5);
        var data = await resp.json();
        ui.status("Authenticating", 1);

        if (data.success == true) {
          api.uid = data.data;
          api.saveFile.set("email", creds["email"])
          api.saveFile.set("password", creds["password"])
          ui.status("Loading Game", 0);
          return true;
        } else {
          ui.status("Showing Error", 0);
          await api.ui.alert({
            "text": data.data,
            "title": "Error",
            "button": "Ok",
          });
          return false;
        }
      } else if (creds["button"] == 0) {
        registering = !registering;
      } else if (creds["button"] == -2) {
        ui.status("Generating username", 0)
        var resp = await fetch(api.prefix + "new_anonymous_user")
        ui.status("Generating username", 0.5)
        var response = await resp.json();
        ui.status("Generating username", 1)
        if (!response.success) {
          ui.status("Showing Error", 0);
          await api.ui.alert({
            "text": response.data,
            "title": "Error",
            "button": "Ok",
          });
          return false;
        }
        ui.status("Creating account", 0);
        const username = response.data;
        resp = await fetch(api.prefix + "create_user/" + encodeURIComponent(username) + "/" + encodeURIComponent("password"));
        ui.status("Creating account", 0.5);
        response = await resp.json();
        ui.status("Creating account", 1);
        if (response.success == true) {
          api.uid = response.data;
          api.saveFile.set("email", username)
          api.saveFile.set("password", "password")
          ui.status("Loading Game", 0);
          return true;
        } else {
          ui.status("Showing Error", 0);
          await api.ui.alert({
            "text": data.data,
            "title": "Error",
            "button": "Ok",
          });
          return false;
        }
      } else if (creds["button"] == -1) {
        return false;
      }
    }
  } else {
    ui.status("Authenticated", 0);
    resp = await fetch(api.prefix + "login_user/" + encodeURIComponent(email) + "/" + encodeURIComponent(password))
    ui.status("Authenticating", 0.5);
    data = await resp.json();
    ui.status("Authenticating", 1);
    if (data.success) {
      api.uid = data.data;
      ui.status("Loading Game", 0);
      return true;
    } else {
      ui.status("Showing Error", 0);
      await api.ui.alert({
        "text": data.data,
        "title": "Error",
        "button": "Ok",
      });
      await api.saveFile.set("email", "default");
      await api.saveFile.set("password", "default");
      await api.ui.reloadSelf();
    }
  }
}
