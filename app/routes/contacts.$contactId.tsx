// import { Form } from "@remix-run/react";
import type { FunctionComponent } from "react";

import type { ContactRecord } from "../data";

// 連絡先ページにloader関数を追加して、useLoaderDataを使ってデータにアクセスする
import { json } from "@remix-run/node";
import {
  Form,
  useFetcher,
  useLoaderData,
} from "@remix-run/react";
import { getContact, updateContact } from "../data";
// Typescriptのエラー解消で下のasync関数にも手を入れた
// コードに潜在的な問題があると予想される場合に、カスタムメッセージでエラーをスローするための便利な関数[invariant]
export const loader = async ({
  params,
 }: LoaderFunctionArgs) => {
  invariant(params.contactId, "Missing contactId param");
  const contact = await getContact(params.contactId);
  // そのidの連絡先がなくてnullになっちゃうときは404を返す
  if (!contact) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ contact });
};

// Typescriptのエラー解消
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/node";
import invariant from "tiny-invariant";

// お気に入り機能の⭐︎のaction関数
export const action = async ({
  params,
  request,
}: ActionFunctionArgs) => {
  invariant(params.contactId, "Missing contactId param");
  const formData = await request.formData();
  return updateContact(params.contactId, {
    favorite: formData.get("favorite") === "true",
  });
};


export default function Contact() {
  // 連絡先ページにloader関数を追加して、useLoaderDataを使ってデータにアクセスする
  const { contact } = useLoaderData<typeof loader>();

  // const contact = {
  //   first: "Your",
  //   last: "Name",
  //   avatar: "https://placecats.com/200/200",
  //   twitter: "your_handle",
  //   notes: "Some notes",
  //   favorite: true,
  // };

  return (
    <div id="contact">
      <div>
        <img
          alt={`${contact.first} ${contact.last} avatar`}
          key={contact.avatar}
          src={contact.avatar}
        />
      </div>

      <div>
        <h1>
          {contact.first || contact.last ? (
            <>
              {contact.first} {contact.last}
            </>
          ) : (
            <i>No Name</i>
          )}{" "}
          <Favorite contact={contact} />
        </h1>

        {contact.twitter ? (
          <p>
            <a
              href={`https://twitter.com/${contact.twitter}`}
            >
              {contact.twitter}
            </a>
          </p>
        ) : null}

        {contact.notes ? <p>{contact.notes}</p> : null}

        <div>
          <Form action="edit">
            <button type="submit">Edit</button>
          </Form>

          <Form
            // contacts.\$contactId_.destroy.tsxにリクエストを送信
            action="destroy"
            method="post"
            onSubmit={(event) => {
              const response = confirm(
                "Please confirm you want to delete this record."
              );
              if (!response) {
                event.preventDefault();
              }
            }}
          >
            <button type="submit">Delete</button>
          </Form>
        </div>
      </div>
    </div>
  );
}

const Favorite: FunctionComponent<{
  contact: Pick<ContactRecord, "favorite">;
}> = ({ contact }) => {
  const fetcher = useFetcher();
  // fetcher.formDataがactionに送信されるデータを持っているので、それをあらかじめ更新に使っちゃう。って感じ？
  const favorite = fetcher.formData
    ? fetcher.formData.get("favorite") === "true"
    : contact.favorite;

  return (
    // fetcherをつけることで、ナビゲーションを起こす（urlを変える？）ことなくactionやloader関数と通信できる
    <fetcher.Form method="post">
      <button
        aria-label={
          favorite
            ? "Remove from favorites"
            : "Add to favorites"
        }
        name="favorite"
        value={favorite ? "false" : "true"}
      >
        {favorite ? "★" : "☆"}
      </button>
    </fetcher.Form>
  );
};
