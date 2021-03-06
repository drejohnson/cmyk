import { Field, Formik } from 'formik';
import gql from 'graphql-tag';
import { History } from 'history';
import { rem } from 'polished';
import React from 'react';
import { MutationFn } from 'react-apollo';
import { RouteComponentProps } from 'react-router';
import styled from 'styled-components';
import * as yup from 'yup';
import { Role } from '../../__generated__/globalTypes';
import {
  CreateUserMutation,
  CreateUserMutationVariables,
} from './__generated__/CreateUserMutation';
import { Users } from './__generated__/Users';
import { USERS_QUERY } from './AdminUsers';
import Button from './components/Button';
import Heading from './components/Heading';
import Input from './components/Input';
import PageLayout from './components/PageLayout';
import Select from './components/Select';
import { useApolloMutation } from './hooks/Apollo';

interface Values {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: Role;
}

interface Props extends RouteComponentProps<{}> {}

function AdminNewUser({ history }: Props) {
  const mutate = useApolloMutation<
    CreateUserMutation,
    CreateUserMutationVariables
  >(CREATE_USER_MUTATION);
  return (
    <PageLayout>
      <Heading>New user</Heading>

      <Formik<Values>
        initialValues={{
          email: '',
          firstName: '',
          lastName: '',
          password: '',
          role: Role.UNAUTHORIZED,
        }}
        onSubmit={onSubmit(mutate, history)}
        validationSchema={validationSchema}
      >
        {({ handleSubmit, isValid }) => (
          <NewUserForm onSubmit={handleSubmit}>
            <EmailField name="email" component={Input} label="Email" />
            <Field name="firstName" component={Input} label="First name" />
            <Field name="lastName" component={Input} label="Last name" />
            <Field name="password" component={Input} label="Password" />
            <Field
              name="repeatPassword"
              component={Input}
              label="Repeat password"
            />
            <Field
              name="role"
              component={Select}
              label="Role"
              options={[
                { label: 'Admin', value: 'ADMIN' },
                { label: 'Editor', value: 'EDITOR' },
                { label: 'User', value: 'USER' },
                { label: 'Unauthorized', value: 'UNAUTHORIZED' },
              ]}
            />
            <Button type="submit" disabled={!isValid} format="neutral">
              Create
            </Button>
            <Button type="reset">Cancel</Button>
          </NewUserForm>
        )}
      </Formik>
    </PageLayout>
  );
}

function onSubmit(
  mutate: MutationFn<CreateUserMutation, CreateUserMutationVariables>,
  history: History,
): (values: Values) => Promise<void> {
  return async values => {
    await mutate({
      update: (cache, { data }) => {
        const cacheData = cache.readQuery<Users>({
          query: USERS_QUERY,
        });

        if (!(cacheData && cacheData.users && data && data.createUser)) {
          return;
        }

        cache.writeQuery({
          data: { users: [...cacheData.users, data.createUser] },
          query: USERS_QUERY,
        });
      },
      variables: {
        data: {
          email: values.email,
          password: values.password,
          profile: {
            create: {
              firstName: values.firstName,
              lastName: values.lastName,
            },
          },
          role: values.role,
        },
      },
    });
    history.push('/admin/users');
  };
}

const validationSchema = yup.object().shape({
  email: yup
    .string()
    .email()
    .required(),
  firstName: yup
    .string()
    .trim()
    .min(2)
    .required(),
  lastName: yup
    .string()
    .trim()
    .min(2)
    .required(),
  password: yup
    .string()
    .trim()
    .min(4)
    .required(),
});

const CREATE_USER_MUTATION = gql`
  mutation CreateUserMutation($data: UserCreateInput!) {
    createUser(data: $data) {
      id
      email
      createdAt
      updatedAt
      role
      lastLogin
      profile {
        firstName
        lastName
      }
    }
  }
`;

const NewUserForm = styled.form`
  display: grid;
  grid-gap: ${rem(16)};
  grid-template-columns: repeat(4, 1fr);
`;

const EmailField = styled(Field)`
  grid-column: 1 / span 2;
`;

export default AdminNewUser;
