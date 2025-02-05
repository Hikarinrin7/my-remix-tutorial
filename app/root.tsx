import { json, redirect } from "@remix-run/node";
import { useEffect } from "react";


import {
  Form,
  Link,
  Links,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";

// root.tsxからloader関数をエクスポートしてデータをレンダリングする
// import { getContacts } from "./data";
// 検索機能のためにちょっと書き換えた。GETなのでaction関数は呼び出されず、URLが変更されるだけ
export const loader = async ({
  request,
}: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const contacts = await getContacts(q);
  return json({ contacts, q });
};

// root.tsxからaction関数をエクスポートする（連絡先の作成）
import { createEmptyContact, getContacts } from "./data";
export const action = async () => {
  const contact = await createEmptyContact();
  // 新規レコードを作ったとき、編集ページにリダイレクトするようにする。以下のコードを変更
  // return json({ contact });
  return redirect(`/contacts/${contact.id}/edit`);
};



// css読み込み
import type { 
  LinksFunction,
  // 検索機能の実装
  LoaderFunctionArgs,
} from "@remix-run/node";
import appStylesHref from "./app.css?url";
export const links: LinksFunction = () => [
  { rel: "stylesheet", href: appStylesHref },
];


export default function App() {
  // root.tsxからloader関数をエクスポートしてデータをレンダリングする
  const { contacts, q } = useLoaderData<typeof loader>();
  // loading...を表示するためのコード。useNavigationは現在のナビゲーションの状態をidleかloadingかsubmittingで返す
  const navigation = useNavigation();
  // 検索窓に入力中にリアルタイムでフィルターをかける
  const submit = useSubmit();
  // 読み込み中のグルグルを出すため、検索中かどうかを知るための変数を追加。まずナビゲートしているか、していたら検索中かどうか、を確認
  const searching =
    navigation.location &&
    new URLSearchParams(navigation.location.search).has(
      "q"
    );

  // URLSearchParamsと入力値を同期させる
  useEffect(() => {
    const searchField = document.getElementById("q");
    if (searchField instanceof HTMLInputElement) {
      searchField.value = q || "";
    }
  }, [q]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div id="sidebar">
          <h1>Remix Contacts</h1>
          <div>
          {/* // 検索窓に入力中にリアルタイムでフィルターをかける */}
            <Form
              id="search-form"
              // 検索窓に入力するたびにアクセスし直して履歴が溜まる（「historyにpushする」）のを防ぎ、「現在のエントリを次のページで置き換える」
              // 最初の検索かどうかを確認して、置き換えるかどうか決定する。削除するときも一文字ずつじゃなくて一気に戻れる
              onChange={(event) => {
                const isFirstSearch = q === null;
                submit(event.currentTarget, {
                  replace: !isFirstSearch,
                });
              }}
              role="search">
              <input
                id="q"
                aria-label="Search contacts"
                // 読み込み中のグルグル。"loading"はデフォルトのアイコンなのだろうか
                className={searching ? "loading" : ""}
                // 検索後の検索窓に入力内容を残すために、デフォルトをurlから取得する！（検索時のurlは[q=paul]って感じ）
                defaultValue={q || ""}
                placeholder="Search"
                type="search"
                name="q"
              />
              <div
                id="search-spinner"
                aria-hidden
                // 読み込み中のグルグル
                hidden={!searching}
              />
            </Form>
            <Form method="post">
              <button type="submit">New</button>
            </Form>
          </div>
          <nav>
          {/* 入れたいのはこのコード。データベースから
            <ul>
              <li>
                <Link to={`/contacts/1`}>Your Name</Link>
              </li>
            </ul> */}
            {/* root.tsxからloader関数をエクスポートしてデータをレンダリングする */}
            {contacts.length ? (
              <ul>
                {contacts.map((contact) => (
                  <li key={contact.id}>
                    {/* サイドバーをナビリンクで囲み、選択した人にサイドバーで色がつくようにした */}
                    <NavLink
                      className={({ isActive, isPending }) =>
                        isActive
                          ? "active"
                          : isPending
                          ? "pending"
                          : ""
                      }
                      to={`contacts/${contact.id}`}
                    >

                      <Link to={`contacts/${contact.id}`}>
                        {contact.first || contact.last ? (
                          <>
                            {contact.first} {contact.last}
                          </>
                        ) : (
                          <i>No Name</i>
                        )}{" "}
                        {contact.favorite ? (
                          <span>★</span>
                        ) : null}
                      </Link>

                    </NavLink>
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                <i>No contacts</i>
              </p>
            )}
          </nav>
        </div>

        <div
          // loading...でちょっとフェードさせるためのnavigation、でもメイン画面のときはフェードさせない
          className={
            navigation.state === "loading" && !searching
              ? "loading" 
              : ""
          }
          id="detail"
        >
          <Outlet />
        </div>

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
