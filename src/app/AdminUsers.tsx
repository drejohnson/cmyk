import React, { SFC } from 'react';
import Heading from './components/atoms/Heading';
import { Query, QueryResult, Mutation, MutationUpdaterFn } from 'react-apollo';
import gql from 'graphql-tag';
import PageLoader from './components/molecules/PageLoader';
import AdminCreateUser from './AdminCreateUser';
import { NavLink, RouteComponentProps } from 'react-router-dom';

const getUsersQuery = gql`
  query GetUsers {
    users {
      id
      email
      role
    }
  }
`;

const deleteUserMutation = gql`
  mutation DeleteUser($where: UserWhereUniqueInput!) {
    deleteUser(where: $where) {
      id
    }
  }
`;

type Response = {
  users: {
    id: string;
    email: string;
    role: 'ADMIN' | 'EDITOR' | 'USER' | 'UNAUTHORIZED';
  }[];
};

type Props = RouteComponentProps<{}> & {};

const AdminUsers: SFC<Props> = ({ match }) => (
  <div>
    <Heading>Users</Heading>
    <AdminCreateUser />
    <Heading level={3}>All users</Heading>
    <Query query={getUsersQuery}>
      {({ data, error }: QueryResult<Response>) => {
        if (error) {
          return null;
        }

        if (!data || !data.users) {
          return <PageLoader />;
        }

        return (
          <ul>
            {data.users.map(user => (
              <li key={user.id}>
                <NavLink to={`${match.url}/${user.id}`}>{user.email}</NavLink>{' '}
                {user.role}
                <Mutation mutation={deleteUserMutation} update={updateOnDelete}>
                  {mutationFn => (
                    <button
                      onClick={() =>
                        mutationFn({ variables: { where: { id: user.id } } })
                      }
                      type="button"
                    >
                      Delete
                    </button>
                  )}
                </Mutation>
              </li>
            ))}
          </ul>
        );
      }}
    </Query>
  </div>
);

type DeleteUserResponse = {
  deleteUser: {
    id: string;
  };
};

const updateOnDelete: MutationUpdaterFn<DeleteUserResponse> = (
  cache,
  result,
) => {
  if (!result.data) {
    return;
  }

  const cacheResult = cache.readQuery<Response>({
    query: getUsersQuery,
  });

  if (!cacheResult) {
    return;
  }

  const removedId = result.data.deleteUser.id;

  cache.writeQuery({
    query: getUsersQuery,
    data: {
      users: cacheResult.users.filter(user => user.id !== removedId),
    },
  });
};

export default AdminUsers;
