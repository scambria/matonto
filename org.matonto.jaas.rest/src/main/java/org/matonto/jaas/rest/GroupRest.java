package org.matonto.jaas.rest;

/*-
 * #%L
 * org.matonto.jaas.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Path("/groups")
@Api( value = "/groups")
public interface GroupRest {
    /**
     * Retrieves the list of groups in MatOnto.
     *
     * @return a Response with a JSON array of the groups in MatOnto
     */
    @GET
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("List all MatOnto groups")
    Response listGroups();

    /**
     * Creates a group in MatOnto with the passed name.
     *
     * @param groupName the name to give the new group
     * @return a Response indicating the success or failure of the request
     */
    @POST
    @RolesAllowed("admin")
    @ApiOperation("Create a new MatOnto group")
    Response createGroup(@QueryParam("name") String groupName);

    /**
     * Retrieves a specific group in MatOnto.
     *
     * @param groupName the name of the group to retrieve
     * @return a Response with a JSON representation of the group in MatOnto
     */
    @GET
    @Path("{groupId}")
    @RolesAllowed("admin")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("Get a single MatOnto group")
    Response getGroup(@PathParam("groupId") String groupName);

    /**
     * Updates information about the specified group in MatOnto.
     * NOT IMPLEMENTED YET
     *
     * @param groupName the name of the group to update
     * @return a Response indicating the success or failure of the request
     */
    @PUT
    @Path("{groupId}")
    @RolesAllowed("admin")
    @ApiOperation("Update a MatOnto group's information")
    Response updateGroup(@PathParam("groupId") String groupName);

    /**
     * Removes a group from MatOnto, and by consequence removing all users from it as well.
     *
     * @param groupName the name of the group to remove
     * @return a Response indicating the success or failure of the request
     */
    @DELETE
    @Path("{groupId}")
    @RolesAllowed("admin")
    @ApiOperation("Remove a MatOnto group")
    Response deleteGroup(@PathParam("groupId") String groupName);

    /**
     * Retrieves the list of roles of the specified group in MatOnto.
     *
     * @param groupName the name of the group to retrieve roles from
     * @return a Response with a JSON array of the roles of the group in MatOnto
     */
    @GET
    @Path("{groupId}/roles")
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("List roles of a MatOnto group")
    Response getGroupRoles(@PathParam("groupId") String groupName);

    /**
     * Adds a role to the specified group in MatOnto.
     *
     * @param groupName the name of the group to add a role to
     * @param role the name of the role to add to the specified group
     * @return a Response indicating the success or failure of the request
     */
    @PUT
    @Path("{groupId}/roles")
    @RolesAllowed("admin")
    @ApiOperation("Add role to a MatOnto group")
    Response addGroupRole(@PathParam("groupId") String groupName, @QueryParam("role") String role);

    /**
     * Removes a role from the specified group in MatOnto.
     *
     * @param groupName the name of the group to remove a role from
     * @param role the role to remove from the specified group
     * @return a Response indicating the success or failure of the request
     */
    @DELETE
    @Path("{groupId}/roles")
    @RolesAllowed("admin")
    @ApiOperation("Remove role from a MatOnto group")
    Response removeGroupRole(@PathParam("groupId") String groupName, @QueryParam("role") String role);

    /**
     * Retrieves the list of users for the specified group in MatOnto.
     *
     * @param groupName the name of the group to retrieve users from
     * @return a Response with a JSON array of the users of the group in MatOnto
     */
    @GET
    @Path("{groupId}/users")
    @RolesAllowed("admin")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("List users of a MatOnto group")
    Response getGroupUsers(@PathParam("groupId") String groupName);
}
